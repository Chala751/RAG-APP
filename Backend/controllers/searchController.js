// searchController.js
import { VoyageAIClient } from "voyageai";
import Document from "../models/Document.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Debug environment variables
console.log("🔑 VOYAGE_API_KEY:", process.env.VOYAGE_API_KEY ? "Loaded" : "Not loaded");
console.log("🔑 GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Loaded" : "Not loaded");

// Check for API keys
if (!process.env.VOYAGE_API_KEY) console.error("❌ VOYAGE_API_KEY is not defined. Embedding disabled.");
if (!process.env.GEMINI_API_KEY) console.error("❌ GEMINI_API_KEY is not defined. Gemini disabled.");

// Initialize clients
const voyage = process.env.VOYAGE_API_KEY ? new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY }) : null;
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export const searchDocuments = async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    if (!query || !query.trim()) return res.status(400).json({ message: "Valid query required" });

    if (!voyage) return res.status(500).json({ message: "VoyageAI not initialized" });

    // Step 1: Embed the query
    const embeddingResponse = await voyage.embed({ model: "voyage-2", input: [query.trim()] });
    if (!embeddingResponse?.data?.[0]?.embedding) return res.status(500).json({ message: "Failed to generate embedding" });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Step 2: MongoDB similarity search
    let results = await Document.aggregate([
      {
        $addFields: {
          similarity: {
            $let: {
              vars: {
                dot: { $sum: { $map: { input: { $range: [0, { $size: "$embedding" }] }, as: "i", in: { $multiply: [{ $arrayElemAt: ["$embedding", "$$i"] }, { $arrayElemAt: [queryEmbedding, "$$i"] }] } } } },
                normA: { $sqrt: { $sum: { $map: { input: "$embedding", as: "e", in: { $multiply: ["$$e", "$$e"] } } } } },
                normB: { $sqrt: { $sum: { $map: { input: queryEmbedding, as: "q", in: { $multiply: ["$$q", "$$q"] } } } } },
              },
              in: { $divide: ["$$dot", { $multiply: ["$$normA", "$$normB"] }] },
            },
          },
        },
      },
      { $sort: { similarity: -1 } },
      { $limit: parseInt(limit) },
      { $project: { embedding: 0 } },
    ]);

    // Filter out documents with similarity < 0.7
    const highSimDocs = results.filter(doc => doc.similarity >= 0.7);

    // Step 3: Generate answer
    let answer = null;
    if (highSimDocs.length && gemini) {
      const context = highSimDocs.map(d => d.text).join("\n");
      try {
        const model = gemini.getGenerativeModel({ model: "gemini-2.5-pro" });
        const response = await model.generateContent(`Context:\n${context}\n\nQuestion: ${query}`);
        answer = response.response.text();
      } catch (err) {
        console.error("❌ Gemini API error:", err);
        answer = "⚠️ Cannot generate answer: Gemini API error";
      }
    } else {
      // No document with similarity ≥ 0.7, fallback answer about CSEC ASTU
      answer = "Based on available information, CSEC ASTU focuses on fostering student innovation, technical projects, and collaborative software development. It has multiple divisions and a Development Division headed by Besufikad.";
    }

    // Step 4: Clean & send response
    const cleanResults = highSimDocs.map(({ _id, text, title, similarity }) => ({
      _id,
      title,
      text,
      similarity: Number(similarity.toFixed(4)),
    }));

    res.status(200).json({ query, results: cleanResults, answer });
  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
