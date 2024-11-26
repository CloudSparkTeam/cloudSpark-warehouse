import { Request, Response } from 'express';
import { ImagemSateliteService } from '../services/ImagemSateliteServices';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const imagemSateliteService = new ImagemSateliteService();

const sharp = require('sharp');

export class ImagemSateliteController {
  async  criarImagemSatelite(req: Request, res: Response) {
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
        return res.status(400).json({ error: 'Coordenadas e outros parâmetros obrigatórios estão ausentes' });
    }

    try {
        const dataImagem = new Date(data_imagem);
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        const imagemSateliteBase = {
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
            ...(usuario_id && { usuario_id }),
        };

        const pythonExecutable = path.join(__dirname, '../../scripts/venv/Scripts/python.exe');
        const scriptPath = path.join(__dirname, '../../scripts/novaApi.py');
        const command = `${pythonExecutable} ${scriptPath} ${coordenada_oeste} ${coordenada_sul} ${coordenada_leste} ${coordenada_norte} ${startDate.split('T')[0]} ${endDate.split('T')[0]}`;

        console.log(command)
        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro ao executar o script Python: ${error.message}`);
                console.error(`Detalhes do erro: ${stderr}`);
                return res.status(500).json({ error: 'Erro ao buscar imagens' });
            }
            console.log('Script Python executado com sucesso.');

            const linhas = stdout.trim().split('\n');
            const nomesArquivos = linhas.filter(linha => linha.includes('.tif')).map(linha => linha.trim());
            console.log(`Nomes de arquivos gerados: ${nomesArquivos}`);

            try {
                const imagensSalvas = await Promise.all(
                    nomesArquivos.map(nome => 
                        prisma.imagemSatelite.create({
                            data: {
                                ...imagemSateliteBase,
                                nome
                            }
                        })
                    )
                );

                res.status(201).json({ message: "Imagens de satélite salvas com sucesso", imagens: imagensSalvas });
            } catch (dbError) {
                console.error('Erro ao salvar nomes das imagens:', dbError);
                res.status(500).json({ error: 'Erro ao salvar nomes das imagens no banco de dados' });
            }
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

  async obterImagemSatelitePorUsuario(req: Request, res: Response) {
    const { usuario_id } = req.params;

    try {
      const imagemSatelite = await imagemSateliteService.obterImagemSatelitePorUsuario(Number(usuario_id));
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
    const { usuario_id } = req.params;
  
    // Obter as imagens tratadas para o usuário
    const imagens = await imagemSateliteService.listarImagensTratadasPorUsuario(Number(usuario_id));
    console.log(imagens);
  
    const imagensDir = path.join(__dirname, '../../imagens_tratadas_ia'); // Caminho para o diretório das imagens tratadas
  
    // Substituir a extensão .tif por .png para todas as imagens
    const imagensComNovoFormato = imagens
      .filter((imagem): imagem is string => imagem != null)  // Filtra qualquer valor null ou undefined e assegura que 'imagem' é uma string
      .map(imagem => {
        // Verifica se a imagem tem a extensão '.tif' antes de substituir
        if (imagem.endsWith('.tif')) {
          return imagem.replace('.tif', '.png'); // Substitui .tif por .png
        }
        return imagem; // Se não for '.tif', retorna a imagem como está
      });
  
    console.log(imagensComNovoFormato);
  
    // Ler o diretório de imagens
    fs.readdir(imagensDir, (err, files) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao listar as imagens' });
      }
  
      // Verifica o host da requisição para diferenciar entre mobile e web
      const host = req.headers.host;
      const baseURL = host?.includes('10.0.2.2')
        ? 'http://10.0.2.2:3002/imagens_tratadas_ia/'
        : 'http://localhost:3002/imagens_tratadas_ia/';
  
      // Filtra os arquivos para pegar apenas as imagens que estão na lista com a nova extensão
      const imagensTratadas = files
        .filter(file => imagensComNovoFormato.includes(file))  // Filtra os arquivos que estão no array de imagensComNovoFormato
        .map(file => ({
          name: file,
          url: `${baseURL}${file}`,  // Gera a URL para a imagem
        }));
  
      // Retorna a lista de imagens tratadas com as URLs
      res.status(200).json(imagensTratadas);
    });
  }
  

  async recriarImagemSatelite(req: Request, res: Response) {
    const { 
        coordenada_norte, 
        coordenada_sul, 
        coordenada_leste, 
        coordenada_oeste, 
        startDate, 
        endDate, 
        shadowPercentage, 
        cloudPercentage 
    } = req.body;
  
    if (
      !coordenada_norte || !coordenada_sul || !coordenada_leste || !coordenada_oeste ||
      !startDate || !endDate || shadowPercentage === undefined || cloudPercentage === undefined
    ) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios estão ausentes' });
    }
  
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
  
        const registrosExistentes = await prisma.imagemSatelite.findMany({
            where: {
                coordenada_norte,
                coordenada_sul,
                coordenada_leste,
                coordenada_oeste,
                startDate: start,
                endDate: end,
                shadowPercentage,
                cloudPercentage,
            },
            select: {
                nome: true,
            },
        });
  
        const imagensPath = path.join(__dirname, '../../imagens_tratadas_ia');
        const host = req.headers.host;
        const baseURL = host?.includes('10.0.2.2')
            ? 'http://10.0.2.2:3002/imagens_tratadas_ia/'
            : 'http://localhost:3002/imagens_tratadas_ia/';
  
        if (registrosExistentes.length > 0) {
            const nomes = registrosExistentes
                .map((registro) => registro.nome)
                .filter((nome): nome is string => !!nome) // Filtra nomes válidos
                .map((nome) => nome.replace('.tif', '.png'));
  
            const arquivosNaPasta = fs.readdirSync(imagensPath);
            const imagensEncontradas = nomes
                .filter((nome) => arquivosNaPasta.includes(nome))
                .map((nome) => ({
                    name: nome,
                    url: `${baseURL}${nome}`,
                }));
  
            console.log('Imagens encontradas:', imagensEncontradas);
            return res.status(200).json({ message: 'Imagens já geradas anteriormente', arquivos: imagensEncontradas });
        }
  
        const pythonExecutable = path.join(__dirname, '../../scripts/venv/Scripts/python.exe');
        const scriptPath = path.join(__dirname, '../../scripts/novaApi.py');
  
        const command = `${pythonExecutable} ${scriptPath} ${coordenada_oeste} ${coordenada_sul} ${coordenada_leste} ${coordenada_norte} ${startDate.split('T')[0]} ${endDate.split('T')[0]}`;
        console.log(`Comando executado: ${command}`);
  
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro ao executar o script Python: ${error.message}`);
                console.error(`Detalhes do erro: ${stderr}`);
                return res.status(500).json({ error: 'Erro ao buscar imagens' });
            }
  
            console.log('Script Python executado com sucesso.');
            console.log('stdout:', stdout);
  
            const linhas = stdout.trim().split('\n');
            const nomesArquivos = linhas
                .filter((linha) => linha.includes('.tif'))
                .map((linha) => linha.trim().replace('.tif', '.png'));
  
            const arquivosNaPasta = fs.readdirSync(imagensPath);
            const imagensEncontradas = nomesArquivos
                .filter((nome) => arquivosNaPasta.includes(nome))
                .map((nome) => ({
                    name: nome,
                    url: `${baseURL}${nome}`,
                }));
  
            console.log(`Imagens geradas e encontradas: ${imagensEncontradas}`);
            res.status(201).json({ message: 'Imagens geradas novamente', arquivos: imagensEncontradas });
        });
  
    } catch (error) {
        console.error('Erro durante a criação da imagem de satélite:', error);
        res.status(500).json({ error: 'Erro ao criar a imagem de satélite'});
    }
  }
  
async listareTratarImagensTratadas(req: Request, res: Response) {
  const { usuario_id } = req.params;

  try {
      const imagens = await imagemSateliteService.listarImagensTratadasPorUsuario(Number(usuario_id));
      console.log(imagens)
      const imagensDir = path.join(__dirname, '../../imagens_tratadas_ia');
      
      const host = req.headers.host;
      const baseURL = host?.includes('10.0.2.2')
          ? 'http://10.0.2.2:3002/imagens_tratadas_ia/'
          : 'http://localhost:3002/imagens_tratadas_ia/';
      
      const imagensTratadas = await Promise.all(imagens
          .filter(file => file && file.endsWith('.tif')) // Verifica se 'file' não é null antes de usar .endsWith
          .map(async file => {
              if (!file) return null; // Adiciona uma verificação extra para garantir que 'file' não seja null
              
              const inputPath = path.join(imagensDir, file);
              const outputPath = inputPath.replace('.tif', '.png');

              // Verifica se o diretório de saída existe, se não, cria
              const outputDir = path.dirname(outputPath);
              if (!fs.existsSync(outputDir)) {
                  fs.mkdirSync(outputDir, { recursive: true });
              }
      
              // Realiza a conversão da imagem
              await sharp(inputPath)
                  .toFormat('png')
                  .toFile(outputPath);

              return {
                  name: file.replace('.tif', '.png'),
                  url: `${baseURL}${file.replace('.tif', '.png')}`,
              };
          })
      );
      
      // Filtra resultados para remover qualquer possível valor null
      res.status(200).json(imagensTratadas.filter(Boolean));
      
  } catch (error) {
      res.status(500).json({ error: 'Erro ao listar as imagens' });
  }
}

}

export default new ImagemSateliteController();
