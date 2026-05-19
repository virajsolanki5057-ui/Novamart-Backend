import express from "express";
import {
  register,
  login,
  startGoogleAuth,
  googleCallback,
  googleLogin,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/google", startGoogleAuth);
router.get("/google/callback", googleCallback);
router.post("/google", googleLogin);

export default router;
