import { Router, Request, Response } from "express";
import { UsuarioController } from "../controllers";
import { auth } from "../auth";

const routes = Router();

routes.post('/criar', UsuarioController.criarUsuario);
routes.get('/listar', auth, UsuarioController.listarUsuarios);
routes.get('/listar/:id', auth, UsuarioController.obterUsuarioPorId);
routes.put('/atualizar/:id', auth, UsuarioController.atualizarUsuario);
routes.delete('/deletar/:id', auth, UsuarioController.excluirUsuario);
routes.get('/usuario-logado', auth, UsuarioController.obterUsuarioLogado);

routes.use((_: Request, res: Response) => res.json({ error: "Requisição desconhecida" }));
export default routes;