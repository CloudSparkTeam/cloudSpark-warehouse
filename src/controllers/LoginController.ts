import { Request, Response } from 'express';
import { UsuarioService } from '../services/UsuarioServices';
import { generateToken } from '../middlewares';
import { sha512 } from "sha512-crypt-ts";

const usuarioService = new UsuarioService();

export class LoginController {

    async Login(req: Request, res: Response) {
        const { email, senha } = req.body;
        var senhacript = sha512.crypt(senha, "password");
        const user = await usuarioService.obterLogin(email, senhacript);

        if (user) {
            const token = await generateToken(user);
            return res.json({ token });
        }
        return res.json({ error: "Usuário não localizado" });
    }
}

export default new LoginController();