import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ensureAuthenticated } from './middlewares/ensureAuthenticated';

const routes = Router();
const prisma = new PrismaClient();

// Rota de Cadastro de Usuário (POST /register)
routes.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Validação básica de entrada
        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password são obrigatórios.' });
        }

        // Verifica se o usuário já existe
        const userExists = await prisma.user.findUnique({
            where: { username }
        });

        if (userExists) {
            return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
        }

        // Criptografa a senha antes de salvar
        const hashedPassword = await bcrypt.hash(password, 10);

        // Salva o usuário no banco de dados SQLite através do Prisma
        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword
            },
            select: {
                id: true,
                username: true,
                createdAt: true
            }
        });

        return res.status(201).json({
            message: 'Usuário cadastrado com sucesso!',
            user: newUser
        });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
    }
});

// Rota de Login (POST /login)
routes.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Validação básica de entrada
        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password são obrigatórios.' });
        }

        // 1. Busca o usuário no banco via Prisma
        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(400).json({ error: 'Usuário ou senha inválidos.' });
        }

        // 2. Valida a senha usando bcrypt.compare
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Usuário ou senha inválidos.' });
        }

        // 3. Gera o token JWT com o ID do usuário
        const jwtSecret = process.env.JWT_SECRET || 'nexuscomm_super_secret_jwt_key_2026';
        const token = jwt.sign(
            { id: user.id },
            jwtSecret,
            { expiresIn: '1d' }
        );

        // 4. Retorna o token e os dados do usuário (id e username, sem a senha)
        return res.status(200).json({
            message: 'Login realizado com sucesso!',
            token,
            user: {
                id: user.id,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        return res.status(500).json({ error: 'Erro interno ao realizar login.' });
    }
});

// Rota protegida de teste de autenticação (GET /me)
routes.get('/me', ensureAuthenticated, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        // Busca informações adicionais do usuário para retornar
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        return res.status(200).json({
            userId,
            user
        });
    } catch (error) {
        console.error('Erro ao buscar dados do usuário autenticado:', error);
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

export { routes };


