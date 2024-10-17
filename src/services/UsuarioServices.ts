import { PrismaClient } from '@prisma/client';
import { sha512 } from 'sha512-crypt-ts';  // Importa a função 'sha512' de 'sha512-crypt-ts'

const prisma = new PrismaClient();

export class UsuarioService {
  async criarUsuario(nome: string, email: string, senha: string, data_nascimento: string) {
    if (!nome || !email || !senha || !data_nascimento) {
      throw new Error('Campos obrigatórios faltando');
    }

    const now = new Date();

    // Verifique se o usuário já existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: {
        email: email,
      },
    });

    if (usuarioExistente) {
      throw new Error('Usuário com esse e-mail já existe');
    }

    // const salt = "$6$" + Math.random().toString(36).substring(2); 

    // const senhaCriptografada = sha512.crypt(senha, salt);

    try {
      // Tente criar o novo usuário
      const novoUsuario = await prisma.usuario.create({
        data: {
          nome,
          email,
          senha: sha512.crypt(senha, "password"),
          data_nascimento,
          data_criacao: now,
        },
      });

      return novoUsuario;
    } catch (error) {
      console.error('Erro ao salvar o usuário no banco de dados:', error);
      throw new Error('Erro ao salvar o usuário');
    }
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
