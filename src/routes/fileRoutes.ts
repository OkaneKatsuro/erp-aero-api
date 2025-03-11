import { Router } from "express";
import {
    upload,
    uploadFile,
    downloadFile,
    listFiles,
    deleteFile,
    getFileInfo,
    updateFile
} from "../controllers/fileController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/upload", protect, upload.single("file"), uploadFile);
router.get("/:id/download", protect, downloadFile);
router.get("/list", protect, listFiles);
router.delete("/delete/:id", protect, deleteFile);
router.get("/:id", protect, getFileInfo);
router.put("/update/:id", protect, upload.single("file"), updateFile);


export default router;
