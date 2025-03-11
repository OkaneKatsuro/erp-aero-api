import "./config/db"; // Подключаем БД
import { initModels } from "./models";
import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await initModels();
        app.listen(PORT, () => {
            console.log(` Сервер запущен на порту ${PORT}`);
        });
    } catch (error) {
        console.error(" Ошибка запуска сервера:", error);
    }
}

startServer();
