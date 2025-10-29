import { VoyageAIClient } from "voyageai";
import Document from "../models/Document.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ====== Environment validation ======
console.log("🔑 VOYAGE_API_KEY:", process.env.VOYAGE_API_KEY ? "Loaded" : "❌ Missing");
console.log("🔑 GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Loaded" : "❌ Missing");

if (!process.env.VOYAGE_API_KEY) console.error("❌ VOYAGE_API_KEY not defined. Embedding disabled.");
if (!process.env.GEMINI_API_KEY) console.error("❌ GEMINI_API_KEY not defined. Gemini disabled.");

// ====== Initialize clients ======
const voyage = process.env.VOYAGE_API_KEY ? new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY }) : null;
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// ====== Hybrid Search Controller ======
export const searchDocuments = async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({ message: "Please provide a valid query." });
    }

    // === Step 1: Lexical (Keyword) Search ===
    const keywordResults = await Document.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit);

    console.log(`🔍 Keyword results found: ${keywordResults.length}`);

    // === Step 2: Semantic (Vector) Search ===
    if (!voyage) throw new Error("VoyageAI client not initialized.");

    const embeddingResponse = await voyage.embed({
      model: "voyage-2",
      input: [query.trim()],
    });

    if (!embeddingResponse?.data?.[0]?.embedding) {
      throw new Error("Failed to generate query embedding.");
    }

    const queryEmbedding = embeddingResponse.data[0].embedding;

    const vectorResults = await Document.aggregate([
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
                      $map: { input: "$embedding", as: "e", in: { $multiply: ["$$e", "$$e"] } },
                    },
                  },
                },
                normB: {
                  $sqrt: {
                    $sum: {
                      $map: { input: queryEmbedding, as: "q", in: { $multiply: ["$$q", "$$q"] } },
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

    console.log(`🧠 Vector results found: ${vectorResults.length}`);

    // === Step 3: Merge Hybrid Results ===
    const merged = [
      ...keywordResults.map((doc) => ({
        ...doc.toObject(),
        scoreType: "keyword",
        score: doc.score || 0,
      })),
      ...vectorResults.map((doc) => ({
        ...doc,
        scoreType: "vector",
        score: doc.similarity || 0,
      })),
    ];

    // Deduplicate and sort by score
    const unique = Array.from(
      new Map(merged.map((d) => [d._id.toString(), d])).values()
    ).sort((a, b) => b.score - a.score);

    const topDocs = unique.slice(0, limit);

    // === Step 4: Generate Final Answer with Gemini ===
    let answer = "No relevant information found.";

    if (topDocs.length && gemini) {
      try {
        const context = topDocs.map((d) => `Title: ${d.title}\n${d.text}`).join("\n\n");

        const model = gemini.getGenerativeModel({ model: "gemini-2.5-pro" });

        const response = await model.generateContent(
          `You are a helpful assistant. Use the context below to answer accurately.
          
          Context:
          ${context}

          Question:
          ${query}

          Answer in a clear and concise paragraph.`
        );

        let rawAnswer = response.response.text();

        // Clean Gemini output
        answer = rawAnswer
          .replace(/\*\*/g, "")
          .replace(/#+/g, "")
          .replace(/\*/g, "•")
          .replace(/\n{2,}/g, "\n")
          .trim();

        if (answer.toLowerCase().startsWith("answer:")) {
          answer = answer.replace(/^answer:\s*/i, "");
        }

        answer = `✨ ${answer}`;
      } catch (err) {
        console.error("❌ Gemini API error:", err.message);
        answer = "⚠️ Gemini failed to generate a response. Try again later.";
      }
    }

    // === Step 5: Send Clean Response ===
    res.status(200).json({
      query,
      results: topDocs.map((d) => ({
        _id: d._id,
        title: d.title,
        text: d.text,
        score: Number(d.score.toFixed(4)),
        scoreType: d.scoreType,
      })),
      answer,
    });
  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
