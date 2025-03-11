import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import File from "../models/File";

interface AuthRequest extends Request {
    user?: { id: number; email: string };
}

// multer для сохранения файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "uploads/";
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Недопустимый формат файла. Разрешены: JPEG, PNG, PDF, DOCX"));
    }
};


export const upload = multer({ storage, fileFilter });

export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
    console.log("🔍 req.file:", req.file);

    try {
        if (!req.user) {
            res.status(401).json({ message: "Пользователь не авторизован" });
            return;
        }

        if (!req.file) {
            res.status(400).json({ message: "Файл не загружен, проверьте запрос" });
            return;
        }

        const { originalname, mimetype, size, filename } = req.file;
        const filePath = path.join("uploads", filename);

        const newFile = await File.create({
            userId: req.user.id,
            name: originalname,
            extension: path.extname(originalname),
            mimeType: mimetype,
            size,
            uploadDate: new Date(),
            filePath,
        });

        res.status(201).json({ message: "Файл загружен", file: newFile });
    } catch (error) {
        res.status(500).json({ message: "Ошибка загрузки файла", error });
    }
};

export const downloadFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Пользователь не авторизован" });
            return;
        }

        const file = await File.findByPk(req.params.id);
        if (!file) {
            res.status(404).json({ message: "Файл не найден" });
            return;
        }

        const filePath = path.resolve(file.filePath);
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ message: "Файл не найден на сервере" });
            return;
        }

        res.download(filePath, file.name);
    } catch (error) {
        res.status(500).json({ message: "Ошибка скачивания файла", error });
    }
};

export const listFiles = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Пользователь не авторизован" });
            return;
        }

        // Получаем параметры пагинации
        const page = Number(req.query.page) || 1; // Номер страницы
        const pageSize = Number(req.query.list_size) || 10; // Количество файлов
        const offset = (page - 1) * pageSize; //  с  какого файла начинать

        const { count, rows: files } = await File.findAndCountAll({
            where: { userId: req.user.id },
            limit: pageSize,
            offset: offset,
            order: [["uploadDate", "DESC"]], // Новые файлы сверху
        });

        res.json({
            message: "Список файлов",
            totalFiles: count,
            totalPages: Math.ceil(count / pageSize),
            currentPage: page,
            pageSize,
            files,
        });
    } catch (error) {
        res.status(500).json({ message: "Ошибка получения списка файлов", error });
    }
};

export const deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Пользователь не авторизован" });
            return;
        }

        const file = await File.findByPk(req.params.id);
        if (!file) {
            res.status(404).json({ message: "Файл не найден" });
            return;
        }

        if (file.userId !== req.user.id) {
            res.status(403).json({ message: "Вы не можете удалить этот файл" });
            return;
        }

        // Удаляем из локального хранилища
        const filePath = path.resolve(file.filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // кдаляем запись
        await file.destroy();

        res.json({ message: "Файл успешно удалён" });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при удалении файла", error });
    }
};

export const getFileInfo = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Пользователь не авторизован" });
            return;
        }

        const file = await File.findByPk(req.params.id);
        if (!file) {
            res.status(404).json({ message: "Файл не найден" });
            return;
        }

        if (file.userId !== req.user.id) {
            res.status(403).json({ message: "Вы не можете просматривать этот файл" });
            return;
        }

        res.json({
            message: "Информация о файле",
            file: {
                id: file.id,
                name: file.name,
                extension: file.extension,
                mimeType: file.mimeType,
                size: file.size,
                uploadDate: file.uploadDate,
                filePath: file.filePath,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при получении информации о файле", error });
    }
};

export const updateFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Пользователь не авторизован" });
            return;
        }

        const file = await File.findByPk(req.params.id);
        if (!file) {
            res.status(404).json({ message: "Файл не найден" });
            return;
        }

        if (file.userId !== req.user.id) {
            res.status(403).json({ message: "Вы не можете обновить этот файл" });
            return;
        }

        if (!req.file) {
            res.status(400).json({ message: "Новый файл не загружен" });
            return;
        }

        // Удаляем старый файл
        const oldFilePath = path.resolve(file.filePath);
        if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
        }

        // Загружаем новый файл
        const { originalname, mimetype, size, filename } = req.file;
        const newFilePath = path.join("uploads", filename);

        file.name = originalname;
        file.extension = path.extname(originalname);
        file.mimeType = mimetype;
        file.size = size;
        file.uploadDate = new Date();
        file.filePath = newFilePath;

        await file.save();

        res.json({ message: "Файл успешно обновлён", file });
    } catch (error) {
        res.status(500).json({ message: "Ошибка при обновлении файла", error });
    }
};