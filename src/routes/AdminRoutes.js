import express from "express";
import { protect } from "../middleware/auth.js";
import { isAdmin } from "../middleware/isAdmin.js";
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

router.get("/users", protect, isAdmin, adminController.getUsers);
router.get("/user/:id", protect, isAdmin, adminController.getUserById);
router.put("/user/:id", protect, isAdmin, adminController.updateUser);
router.delete("/user/:id", protect, isAdmin, adminController.deleteUser);

router.get("/admins", protect, isAdmin, adminController.getAdmins);
router.get("/admin/:id", protect, isAdmin, adminController.getAdminById);
router.put("/admin/:id", protect, isAdmin, adminController.updateAdmin);
router.delete("/admin/:id", protect, isAdmin, adminController.deleteAdmin);

export default router;
