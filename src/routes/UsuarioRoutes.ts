import { Router } from "express";
import { UsuarioController } from "../controllers";

const routes = Router();

routes.post('/criar', UsuarioController.criarUsuario);
routes.get('/listar', UsuarioController.listarUsuarios);
routes.get('/listar/:id', UsuarioController.obterUsuarioPorId);
routes.put('/atualizar/:id', UsuarioController.atualizarUsuario);
routes.delete('/deletar/:id', UsuarioController.excluirUsuario);


export default routes;