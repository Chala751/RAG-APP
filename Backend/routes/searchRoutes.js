import express from "express";
import { searchDocuments } from "../controllers/searchController.js";


const router = express.Router();

router.post("/search", searchDocuments);

export default router;
