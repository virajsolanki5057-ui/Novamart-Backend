import express from "express";
import { protect } from "../middleware/auth.js";
import * as userController from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", protect, userController.getProfile);
router.put("/profile", protect, userController.updateProfile);
router.put("/change-password", protect, userController.changePassword);

export default router;