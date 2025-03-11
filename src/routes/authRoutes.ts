import {Router, Request, Response} from "express";
import {signup, signin, refreshToken, logout, getUserInfo} from "../controllers/authController";
import {protect} from "../middleware/authMiddleware";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.get("/me", protect, (req: Request, res: Response): void => {
    const authReq = req as any; // Приводим req к типу AuthRequest
    if (!authReq.user) {
        res.status(401).json({message: "Пользователь не авторизован"});
        return;
    }
    res.json({message: "Доступ разрешён", user: authReq.user});
});
router.post("/signin/new_token", refreshToken);
router.post("/logout", protect, logout);
router.get("/info", protect, getUserInfo);

export default router;
