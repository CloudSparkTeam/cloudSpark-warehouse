import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ImagemSateliteService {
  async criarImagemSatelite(
    coordenada_norte: number,
    coordenada_sul: number,
    coordenada_leste: number,
    coordenada_oeste: number,
    data_imagem: Date,
    status: string,
    startDate: Date,
    endDate: Date,
    shadowPercentage: number,
    cloudPercentage: number,
    usuario_id?: number
) {
    const data = {
        coordenada_norte,
        coordenada_sul,
        coordenada_leste,
        coordenada_oeste,
        data_imagem,
        startDate,
        endDate,
        shadowPercentage,
        cloudPercentage,
        status,
        ...(usuario_id !== undefined && { usuario_id }),
    };

    return await prisma.imagemSatelite.create({
        data: data
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
