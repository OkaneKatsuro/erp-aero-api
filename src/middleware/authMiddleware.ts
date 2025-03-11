import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
    user?: { id: number; email: string };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Нет токена, авторизация запрещена" });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number; email: string };
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Неверный или истёкший токен" });
    }
};
