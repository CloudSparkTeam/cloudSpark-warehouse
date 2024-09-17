import { Request, Response } from 'express';
import { ImagemSateliteService } from '../services/ImagemSateliteServices';

const imagemSateliteService = new ImagemSateliteService();

export class ImagemSateliteController {
  async criarImagemSatelite(req: Request, res: Response) {
    const { longitude, latitude, data_imagem, status, usuario_id } = req.body;
    
    if (longitude === undefined || latitude === undefined || data_imagem === undefined || status === undefined) {
      return res.status(400).json({ error: 'Longitude, latitude, data_imagem e status são obrigatórios' });
    }

    try {
      const dataImagem = new Date(data_imagem);
      const imagemSatelite = await imagemSateliteService.criarImagemSatelite(
        longitude,
        latitude,
        dataImagem,
        status,
        usuario_id
      );
      res.status(201).json(imagemSatelite);
    } catch (error) {
      res.status(400).json({ error: 'Erro ao criar a imagem de satélite' });
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
}

export default new ImagemSateliteController();
