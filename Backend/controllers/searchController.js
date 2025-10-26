// searchController.js
import { VoyageAIClient } from "voyageai";
import Document from "../models/Document.js";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Correct import

// Debug environment variables
console.log("🔑 [searchController] VOYAGE_API_KEY:", process.env.VOYAGE_API_KEY ? "Loaded" : "Not loaded");
console.log("🔑 [searchController] GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Loaded" : "Not loaded");

// Check for API keys
if (!process.env.VOYAGE_API_KEY) {
  console.error("❌ VOYAGE_API_KEY is not defined. Embedding features will be disabled.");
}
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not defined. Gemini features will be disabled.");
}

let voyage;
try {
  voyage = process.env.VOYAGE_API_KEY ? new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY }) : null;
} catch (error) {
  console.error("❌ VoyageAIClient initialization failed:", error);
  voyage = null;
}

let gemini;
try {
  gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
} catch (error) {
  console.error("❌ Gemini initialization failed:", error);
  gemini = null;
}

export const searchDocuments = async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ message: "Valid query string is required" });
    }

    if (!voyage) {
      return res.status(500).json({ message: "VoyageAI is not initialized due to missing or invalid API key" });
    }

    // Step 1: Embed the query
    console.log("📡 Generating embedding for query:", query);
    const embeddingResponse = await voyage.embed({
      model: "voyage-2",
      input: [query.trim()],
    });

    if (!embeddingResponse?.data?.[0]?.embedding) {
      return res.status(500).json({ message: "Failed to generate query embedding" });
    }

    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log("✅ Embedding generated, length:", queryEmbedding.length);

    // Step 2: Perform vector similarity search
    console.log("🔍 Performing MongoDB similarity search...");
    const results = await Document.aggregate([
      {
        $addFields: {
          similarity: {
            $let: {
              vars: {
                dot: {
                  $sum: {
                    $map: {
                      input: { $range: [0, { $size: "$embedding" }] },
                      as: "i",
                      in: {
                        $multiply: [
                          { $arrayElemAt: ["$embedding", "$$i"] },
                          { $arrayElemAt: [queryEmbedding, "$$i"] },
                        ],
                      },
                    },
                  },
                },
                normA: {
                  $sqrt: {
                    $sum: {
                      $map: {
                        input: "$embedding",
                        as: "e",
                        in: { $multiply: ["$$e", "$$e"] },
                      },
                    },
                  },
                },
                normB: {
                  $sqrt: {
                    $sum: {
                      $map: {
                        input: queryEmbedding,
                        as: "q",
                        in: { $multiply: ["$$q", "$$q"] },
                      },
                    },
                  },
                },
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
    console.log("✅ MongoDB search completed, results:", results.length);

    // Step 3: Generate AI answer (if Gemini enabled)
    let answer = null;
    if (results.length > 0 && gemini) {
      const context = results.map((d) => d.text).join("\n");
      console.log("📝 Generating Gemini answer with context length:", context.length);
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent(`Context:\n${context}\n\nQuestion: ${query}`);
      answer = response.response.text();
      console.log("✅ Gemini answer generated");
    } else if (!gemini) {
      console.warn("⚠️ Gemini not initialized. Skipping answer generation.");
    }

    // Step 4: Clean & send response
    const cleanResults = results.map(({ _id, text, title, similarity }) => ({
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