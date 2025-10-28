import { VoyageAIClient } from "voyageai";
import Document from "../models/Document.js";

const client = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
});

// Simple recursive chunker
function chunkText(text, maxLength = 300, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += maxLength - overlap) {
    const chunk = words.slice(i, i + maxLength).join(" ");
    chunks.push(chunk);
    if (i + maxLength >= words.length) break;
  }

  return chunks;
}

export const uploadText = async (req, res) => {
  try {
    const { text, title } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Text is required" });
    }

    // Step 1: Chunk text
    const chunks = chunkText(text);

    // Step 2: Embed all chunks at once
    const embeddingResponse = await client.embed({
      model: "voyage-2",
      input: chunks,
    });

    // Step 3: Store each chunk with metadata
    const docs = await Promise.all(
      chunks.map((chunk, i) => {
        const embedding = embeddingResponse.data[i].embedding;
        const doc = new Document({
          title: title || `Document ${Date.now()}`,
          text: chunk,
          chunkIndex: i,
          keywords: chunk.split(/\W+/).slice(0, 10), // simple keyword extraction
          embedding,
        });
        return doc.save();
      })
    );

    res.status(201).json({
      message: `✅ ${docs.length} chunks embedded and stored successfully`,
      documents: docs,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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