import { Router, Request, Response } from "express";
import ImagemSateliteController from '../controllers/ImagemSateliteController';
import { auth } from "../auth";

const routes = Router();

routes.post('/criar', ImagemSateliteController.criarImagemSatelite);
routes.get('/listar', ImagemSateliteController.listarImagensSatelite);
routes.get('/listar/:id', ImagemSateliteController.obterImagemSatelitePorId);
routes.get('/listarUsuario/:usuario_id', ImagemSateliteController.obterImagemSatelitePorUsuario);
routes.put('/atualizar/:id', auth, ImagemSateliteController.atualizarImagemSatelite);
routes.delete('/deletar/:id', auth, ImagemSateliteController.excluirImagemSatelite);
routes.get('/imagens-tratadas/:usuario_id', ImagemSateliteController.listareTratarImagensTratadas);
routes.post('/gerarNovamente/:id', ImagemSateliteController.recriarImagemSatelite);

routes.use((_: Request, res: Response) => res.json({ error: "Requisição desconhecida" }));
export default routes;