import express from "express";
import { createContact, getContacts, deleteContact } from "../controllers/contactController.js";

const router = express.Router();

router.post("/contacts", createContact);
router.get("/contacts", getContacts);
router.delete("/contacts/:id", deleteContact);

export default router;
