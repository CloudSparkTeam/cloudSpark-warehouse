import { Request, Response } from 'express';
import { UsuarioService } from '../services/UsuarioServices';
import { sha512 } from "sha512-crypt-ts";

const usuarioService = new UsuarioService();

export class UsuarioController {
  async criarUsuario(req: Request, res: Response) {
    const { nome, email, senha, data_nascimento } = req.body;
  
    if (!nome || !email || !senha || !data_nascimento) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
  
    try {
      const usuario = await usuarioService.criarUsuario(nome, email, senha, data_nascimento);
      res.status(201).json(usuario);
    } catch (error) {
      res.status(400).json({ error: 'Erro ao cadastar o usuário' });
    }
  }

  async listarUsuarios(req: Request, res: Response) {
    const usuarios = await usuarioService.listarUsuarios();
    res.status(200).json(usuarios);
  }

  async obterUsuarioPorId(req: Request, res: Response) {
    const { id } = req.params;
    const usuario = await usuarioService.obterUsuarioPorId(Number(id));
    if (usuario) {
      res.status(200).json(usuario);
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  }

  async atualizarUsuario(req: Request, res: Response) {
    const { id } = req.params;
    const { nome, senha } = req.body;
  
    const dadosAtualizados: Partial<{ nome: string; senha: string }> = {};
    if (nome) dadosAtualizados.nome = nome;
    if (senha) dadosAtualizados.senha = sha512.crypt(senha, "password");
  
    try {
      const usuario = await usuarioService.atualizarUsuario(Number(id), dadosAtualizados);
      res.status(200).json(usuario);
    } catch (error) {
      res.status(400).json({ error: 'Erro ao atualizar usuário' });
    }
  }

  async excluirUsuario(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await usuarioService.excluirUsuario(Number(id));
      res.status(200).json('Usuário deletado com sucesso');
    } catch (error) {
      res.status(400).json({ error: 'Erro ao excluir usuário' });
    }
  }
}

export default new UsuarioController();