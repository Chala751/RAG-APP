import express from "express";
import { deleteDocument, getAllDocuments, uploadText } from "../controllers/embedController.js";
import { verifyAdmin } from "../middleware/auth.js";


const router = express.Router();

// Admin can see and delete documents
router.get("/", verifyAdmin, getAllDocuments);
router.delete("/:id", verifyAdmin, deleteDocument);

router.post("/upload-text",verifyAdmin, uploadText);

export default router;
