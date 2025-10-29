import { VoyageAIClient } from "voyageai";
import Document from "../models/Document.js";

const voyage = process.env.VOYAGE_API_KEY
  ? new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY })
  : null;

// Utility: simple chunker by sentences or words
const chunkText = (text, chunkSize = 100) => {
  const words = text.split(" ");
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  return chunks;
};

export const uploadText = async (req, res) => {
  try {
    const { title, text } = req.body;
    if (!text) return res.status(400).json({ message: "Text is required." });
    if (!voyage) throw new Error("VoyageAI client not initialized.");

    const chunks = chunkText(text, 100); // 100 words per chunk
    const docs = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embeddingResp = await voyage.embed({
        model: "voyage-2",
        input: [chunk],
      });
      const embedding = embeddingResp?.data?.[0]?.embedding;
      if (!embedding) continue;

      const doc = new Document({
        title,
        text: chunk,
        chunkIndex: i,
        keywords: chunk
          .split(" ")
          .map((w) => w.toLowerCase())
          .filter((w) => w.length > 2),
        embedding,
      });

      docs.push(doc);
    }

    await Document.insertMany(docs);
    res.status(201).json({ success: true, insertedChunks: docs.length });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



// ===== Get All Uploaded Texts =====
export const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ===== Delete Document by ID =====
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Document.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};