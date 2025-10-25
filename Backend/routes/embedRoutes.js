import express from "express";
import { uploadText } from "../controllers/embedController.js";
const router = express.Router();

router.post("/upload-text", uploadText);

export default router;
