import VoyageAI from "voyageai";
import Document from "../models/Document.js";

const voyage = new VoyageAI({ apiKey: process.env.VOYAGE_API_KEY });

export const uploadText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    
    const embeddingResponse = await voyage.embed({
      model: "voyage-2",
      input: text,
    });

    const embedding = embeddingResponse.data[0].embedding;

    
    const newDoc = new Document({ text, embedding });
    await newDoc.save();

    res.status(201).json({
      message: "Document embedded and stored successfully",
      document: newDoc,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
