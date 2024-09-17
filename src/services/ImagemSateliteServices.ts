import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ImagemSateliteService {
  async criarImagemSatelite(
    longitude: number,
    latitude: number,
    data_imagem: Date,
    status: string,
    usuario_id?: number
  ) {
    const now = new Date();

    const data = {
      longitude,
      latitude,
      data_imagem,
      data_download: now,
      status,
      ...(usuario_id !== undefined && { usuario_id }),
    };

    return await prisma.imagemSatelite.create({
      data,
    });
  }

  async listarImagensSatelite() {
    return await prisma.imagemSatelite.findMany();
  }

  async obterImagemSatelitePorId(id: number) {
    return await prisma.imagemSatelite.findUnique({
      where: { id }
    });
  }

  async atualizarImagemSatelite(
    id: number,
    data: Partial<{
      longitude: number;
      latitude: number;
      data_imagem: Date;
      status: string;
      usuario_id?: number;
    }>
  ) {
    return await prisma.imagemSatelite.update({
      where: { id },
      data,
    });
  }

  async excluirImagemSatelite(id: number) {
    return await prisma.imagemSatelite.delete({
      where: { id },
    });
  }
}
