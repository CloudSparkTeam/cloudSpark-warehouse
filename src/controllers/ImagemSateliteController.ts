import { Request, Response } from 'express';
import { ImagemSateliteService } from '../services/ImagemSateliteServices';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const imagemSateliteService = new ImagemSateliteService();

export class ImagemSateliteController {
  async criarImagemSatelite(req: Request, res: Response) {
    const { 
        coordenada_norte, 
        coordenada_sul, 
        coordenada_leste, 
        coordenada_oeste, 
        data_imagem, 
        status, 
        startDate, 
        endDate, 
        shadowPercentage, 
        cloudPercentage, 
        usuario_id 
    } = req.body;

    if (
        coordenada_norte === undefined ||
        coordenada_sul === undefined ||
        coordenada_leste === undefined ||
        coordenada_oeste === undefined ||
        data_imagem === undefined ||
        status === undefined ||
        startDate === undefined ||
        endDate === undefined ||
        shadowPercentage === undefined ||
        cloudPercentage === undefined
    ) {
        return res.status(400).json({ error: 'Coordenadas (norte, sul, leste, oeste), data_imagem e status são obrigatórios' });
    }

    try {
        const dataImagem = new Date(data_imagem);
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        // Salvar apenas as coordenadas e outras informações inicialmente
        const imagemSatelite = await prisma.imagemSatelite.create({
            data: {
                coordenada_norte,
                coordenada_sul,
                coordenada_leste,
                coordenada_oeste,
                data_imagem: dataImagem,
                status,
                startDate: startDateObj,
                endDate: endDateObj,
                shadowPercentage,
                cloudPercentage,
                ...(usuario_id !== undefined && { usuario_id }),
            }
        });

        console.log('Imagem de satélite criada com sucesso. Preparando para executar o script Python...');

        const startDateFormatted = startDate.split('T')[0];
        const endDateFormatted = endDate.split('T')[0];

        const pythonExecutable = path.join(__dirname, '../../scripts/venv/Scripts/python.exe');
        const scriptPath = path.join(__dirname, '../../scripts/novaApi.py');

        const command = `${pythonExecutable} ${scriptPath} ${coordenada_oeste} ${coordenada_sul} ${coordenada_leste} ${coordenada_norte} ${startDateFormatted} ${endDateFormatted}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro ao executar o script Python: ${error.message}`);
                console.error(`Detalhes do erro: ${stderr}`);
                return res.status(500).json({ error: 'Erro ao buscar imagens' });
            }
            console.log('Script Python executado com sucesso.');

            // Captura a saída e processa os nomes dos arquivos
            const nomesArquivos = stdout.trim().split('\n');  // Assume que cada nome de arquivo está em uma nova linha
            console.log(`Nomes de arquivos gerados: ${nomesArquivos}`);

            // Salvar os nomes no banco de dados
            const promises = nomesArquivos.map(async (nome) => {
                return prisma.imagemSatelite.updateMany({
                    where: { id: imagemSatelite.id },  // Aqui, você pode ajustar a lógica conforme necessário
                    data: { nome }
                });
            });

            Promise.all(promises)
                .then(() => {
                    res.status(201).json({ ...imagemSatelite, nomes: nomesArquivos });
                })
                .catch((dbError) => {
                    console.error('Erro ao atualizar os nomes das imagens:', dbError);
                    res.status(500).json({ error: 'Erro ao salvar nomes das imagens' });
                });
        });
    } catch (error) {
        console.error('Erro durante a criação da imagem de satélite:', error);
        res.status(400).json({ error: 'Erro ao criar a imagem de satélite', details: error });
    }
}

  async listarImagensSatelite(req: Request, res: Response) {
    try {
      const imagensSatelite = await imagemSateliteService.listarImagensSatelite();
      res.status(200).json(imagensSatelite);
    } catch (error) {
      res.status(400).json({ error: 'Erro ao listar as imagens de satélite' });
    }
  }

  async obterImagemSatelitePorId(req: Request, res: Response) {
    const { id } = req.params;
    
    try {
      const imagemSatelite = await imagemSateliteService.obterImagemSatelitePorId(Number(id));
      if (imagemSatelite) {
        res.status(200).json(imagemSatelite);
      } else {
        res.status(404).json({ error: 'Imagem de satélite não encontrada' });
      }
    } catch (error) {
      res.status(400).json({ error: 'Erro ao obter a imagem de satélite' });
    }
  }

  async atualizarImagemSatelite(req: Request, res: Response) {
    const { id } = req.params;
    const { longitude, latitude, data_imagem, status, usuario_id } = req.body;

    const dadosAtualizados: Partial<{
      longitude: number;
      latitude: number;
      data_imagem: Date;
      status: string;
      usuario_id?: number;
    }> = {};

    if (longitude !== undefined) dadosAtualizados.longitude = longitude;
    if (latitude !== undefined) dadosAtualizados.latitude = latitude;
    if (data_imagem !== undefined) dadosAtualizados.data_imagem = new Date(data_imagem);
    if (status !== undefined) dadosAtualizados.status = status;
    if (usuario_id !== undefined) dadosAtualizados.usuario_id = usuario_id;

    try {
      const imagemSatelite = await imagemSateliteService.atualizarImagemSatelite(Number(id), dadosAtualizados);
      res.status(200).json(imagemSatelite);
    } catch (error) {
      res.status(400).json({ error: 'Erro ao atualizar a imagem de satélite' });
    }
  }

  async excluirImagemSatelite(req: Request, res: Response) {
    const { id } = req.params;

    try {
      await imagemSateliteService.excluirImagemSatelite(Number(id));
      res.status(200).json('Imagem de satélite deletada com sucesso');
    } catch (error) {
      res.status(400).json({ error: 'Erro ao excluir a imagem de satélite' });
    }
  }

  async listarImagensTratadas(req: Request, res: Response) {
    const imagensDir = path.join(__dirname, '../../imagens_tratadas_ia'); // Ajuste o caminho conforme necessário

    fs.readdir(imagensDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao listar as imagens' });
        }

        // Verifica o host da requisição para diferenciar mobile e web
        const host = req.headers.host;
        const baseURL = host?.includes('10.0.2.2') 
            ? 'http://10.0.2.2:3002/imagens_tratadas_ia/' 
            : 'http://localhost:3002/imagens_tratadas_ia/'; 

        const imagensTratadas = files
            .filter(file => file.endsWith('.png')) // Filtra apenas arquivos .png
            .map(file => ({
                name: file,
                url: `${baseURL}${file}`,  // Usa a baseURL apropriada
            }));

        res.status(200).json(imagensTratadas);
    });
  }

}

export default new ImagemSateliteController();
