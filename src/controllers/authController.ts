import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler"; // Новый импорт
import User from "../models/User";

interface AuthRequest extends Request {
    user?: { id: number; email: string };
}

const blacklistedTokens = new Set<string>();

const generateTokens = (userId: number, email: string) => {
    const accessToken = jwt.sign({ id: userId, email }, process.env.JWT_SECRET as string, { expiresIn: "10m" });
    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "7d" });

    return { accessToken, refreshToken };
};


export const signup = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("Введите email и пароль");
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        res.status(400);
        throw new Error("Пользователь уже существует");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashedPassword });

    const token = generateTokens(newUser.id, newUser.email);

    res.status(201).json({ token, user: { id: newUser.id, email: newUser.email } });
});


export const signin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            res.status(401).json({ message: "Неверный email или пароль" });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400);
            throw new Error("Неверный email или пароль");
        }

        const { accessToken, refreshToken } = generateTokens(user.id, user.email);

        user.refreshToken = refreshToken;
        await user.save();

        res.json({ message: "Вход выполнен", accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при входе", error });
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ message: "Токен не передан" });
            return;
        }

        const user = await User.findOne({ where: { refreshToken: token } });
        if (!user) {
            res.status(403).json({ message: "Недействительный токен" });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };

        const { accessToken, refreshToken } = generateTokens(decoded.id, user.email);

        user.refreshToken = refreshToken;
        await user.save();

        res.json({ message: "Токен обновлён", accessToken, refreshToken });
    } catch (error) {
        res.status(403).json({ message: "Ошибка обновления токена", error });
    }
};


export const getUserInfo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Пользователь не авторизован" });
            return;
        }

        res.json({
            message: "Информация о пользователе",
            user: {
                id: req.user.id,
                email: req.user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при получении информации о пользователе", error });
    }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Пользователь не авторизован" });
            return;
        }

        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(" ")[1];
            blacklistedTokens.add(token);
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            res.status(404).json({ message: "Пользователь не найден" });
            return;
        }

        user.refreshToken = null;
        await user.save();

        res.json({ message: "Выход выполнен, токены аннулированы" });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при выходе", error });
    }
};

// Middleware для блокировки чёрных токенов
export const checkBlacklistedToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        if (blacklistedTokens.has(token)) {
            return res.status(403).json({ message: "Токен недействителен" });
        }
    }
    next();
};