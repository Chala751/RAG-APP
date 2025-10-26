import express from "express";
import { uploadText } from "../controllers/embedController.js";
import { verifyAdmin } from "../middleware/auth.js";


const router = express.Router();

router.post("/upload-text",verifyAdmin, uploadText);

export default router;
