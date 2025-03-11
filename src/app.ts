import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import fileRoutes from "./routes/fileRoutes";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/uploads", express.static("uploads"));
app.use("/auth", authRoutes);
app.use("/file", fileRoutes);

export default app;
