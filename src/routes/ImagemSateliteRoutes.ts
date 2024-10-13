import { Router, Request, Response } from "express";
import ImagemSateliteController from '../controllers/ImagemSateliteController';
import { auth } from "../auth";

const routes = Router();

routes.post('/criar', auth, ImagemSateliteController.criarImagemSatelite);
routes.get('/listar', ImagemSateliteController.listarImagensSatelite);
routes.get('/listar/:id', ImagemSateliteController.obterImagemSatelitePorId);
routes.put('/atualizar/:id', auth, ImagemSateliteController.atualizarImagemSatelite);
routes.delete('/deletar/:id', auth, ImagemSateliteController.excluirImagemSatelite);

routes.use((_: Request, res: Response) => res.json({ error: "Requisição desconhecida" }));
export default routes;