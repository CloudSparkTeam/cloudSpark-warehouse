import { Router, Request, Response } from "express";

import { default as UsuarioRoutes } from "./UsuarioRoutes";
import { default as ImagemSateliteRoutes } from "./ImagemSateliteRoutes";
import { default as Login } from "../controllers/LoginController";
const router = Router();

router.post("/login", Login.Login);
router.use("/usuario", UsuarioRoutes);
router.use("/imagemSatelite", ImagemSateliteRoutes);

router.use((_: Request, res: Response) => res.json({ error: "Requisição desconhecida" }));
export default router;