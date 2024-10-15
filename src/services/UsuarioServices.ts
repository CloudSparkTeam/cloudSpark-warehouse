import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UsuarioService {
    async criarUsuario(nome?: string, email?: string, senha?: string) {
        if (!nome || !email || !senha) {
          throw new Error('Campos obrigatórios faltando');
        }

        const now = new Date();
        
        return await prisma.usuario.create({
          data: {
            nome,
            email,
            senha,
            data_criacao: now,
          },
        });
      }

  async listarUsuarios() {
    return await prisma.usuario.findMany();
  }

  async obterUsuarioPorId(id: number) {
    return await prisma.usuario.findUnique({
      where: { id }
    });
  }

  async obterLogin(email: string, senha: string)
  {
    return await prisma.usuario.findUnique({
      where: { email: email, senha: senha}
    });
  }

  async atualizarUsuario(id: number, data: Partial<{ nome: string; senha: string }>) {
    return await prisma.usuario.update({
      where: { id },
      data,
    });
  }

  async excluirUsuario(id: number) {
    return await prisma.usuario.delete({
      where: { id },
    });
  }
}
