import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const prisma = new PrismaClient();
const execPromise = promisify(exec); // Promisify exec for async/await

export class ImagemSateliteService {
  async criarImagemSatelite({
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
    usuario_id,
    nome // Novo parâmetro
  }: {
    coordenada_norte: number;
    coordenada_sul: number;
    coordenada_leste: number;
    coordenada_oeste: number;
    data_imagem: Date;
    status: string;
    startDate: Date;
    endDate: Date;
    shadowPercentage: number;
    cloudPercentage: number;
    usuario_id?: number;
    nome?: string; // Indicar que é opcional
  }) {
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
      ...(nome !== undefined && { nome }) // Adiciona o nome se estiver presente
    };

    return await prisma.imagemSatelite.create({
      data: data
    });
  }

  async executarScriptPython(): Promise<string[]> {
    try {
        const { stdout } = await execPromise('python caminho/para/seu/script.py');
        console.log("Saída do script:", stdout);

        // Nova regex para capturar somente o nome do arquivo e sem a extensão
        const regex = /CBERS4A_WPM_PCA_RGB321_\d{8}_\d{3}_\d{3}(?=_thumbnail)/g;
        const matches = stdout.match(regex);

        if (matches) {
            // Remove duplicatas e retorna apenas os nomes capturados
            return Array.from(new Set(matches.map(name => name.replace(/_thumbnail$/, ''))));
        }

        return []; // Retorna um array vazio se não houver correspondências
    } catch (error) {
        console.error("Erro ao executar o script Python:", error);
        return []; // Retorna array vazio em caso de erro
    }
  }


  async criarImagemComScript({
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
    usuario_id,
}: {
    coordenada_norte: number;
    coordenada_sul: number;
    coordenada_leste: number;
    coordenada_oeste: number;
    data_imagem: Date;
    status: string;
    startDate: Date;
    endDate: Date;
    shadowPercentage: number;
    cloudPercentage: number;
    usuario_id?: number;
}) {
    const nomes = await this.executarScriptPython();

    return await this.criarImagemSatelite({
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
        usuario_id,
        nome: nomes[0] || undefined,
    });
}


  async atualizarNomeImagem(id: number, nome: string) {
    return await prisma.imagemSatelite.update({
      where: { id },
      data: { nome }
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

  async obterImagemSatelitePorUsuario(usuario_id: number) {
    return await prisma.imagemSatelite.findMany({
      where: { usuario_id }
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

  async listarImagensTratadasPorUsuario(usuario_id: number) {
    // Busca as imagens de satélite do usuário no banco
    const imagens = await prisma.imagemSatelite.findMany({
        where: { usuario_id },
        select: { nome: true }  // Aqui estamos assumindo que "nome" é o nome do arquivo
    });

    return imagens.map(imagem => imagem.nome);
}

}