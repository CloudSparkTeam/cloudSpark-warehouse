import { Request, Response } from 'express';
import { ImagemSateliteService } from '../services/ImagemSateliteServices';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const imagemSateliteService = new ImagemSateliteService();

export class ImagemSateliteController {
  async criarImagemSatelite(req: Request, res: Response) {
    const { coordenada_norte, coordenada_sul, coordenada_leste, coordenada_oeste, data_imagem, status, startDate, endDate, shadowPercentage, cloudPercentage, usuario_id } = req.body;

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
        const startDateObj = new Date(startDate);  // Convertendo startDate para objeto Date
        const endDateObj = new Date(endDate); 
        const imagemSatelite = await imagemSateliteService.criarImagemSatelite(
            coordenada_norte,
            coordenada_sul,
            coordenada_leste,
            coordenada_oeste,
            dataImagem,
            status,
            startDateObj,
            endDateObj,
            shadowPercentage,
            cloudPercentage,
            usuario_id
        );

        // Executar o script Python após criar a imagem de satélite
        console.log('Imagem de satélite criada com sucesso.');
        console.log('Preparando para executar o script Python...');

        // Formatar datas
        const startDateFormatted = startDate.split('T')[0]; // Remove a parte da hora
        const endDateFormatted = endDate.split('T')[0]; // Remove a parte da hora

        // Caminhos do Python e do script
        const pythonExecutable = path.join(__dirname, '../../scripts/venv/Scripts/python.exe');
        const scriptPath = path.join(__dirname, '../../scripts/novaApi.py');

        // Comando atualizado
        const command = `${pythonExecutable} ${scriptPath} ${coordenada_oeste} ${coordenada_sul} ${coordenada_leste} ${coordenada_norte} ${startDateFormatted} ${endDateFormatted}`;

        console.log(`Comando para execução: ${command}`);

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro ao executar o script Python: ${error.message}`);
                console.error(`Detalhes do erro: ${stderr}`);
                return res.status(500).json({ error: 'Erro ao buscar imagens' });
            }
            console.log('Script Python executado com sucesso.');
            console.log(`Saída do script: ${stdout}`);
            
            // Enviar a resposta ao cliente aqui, após a execução do script Python
            res.status(201).json(imagemSatelite);
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
