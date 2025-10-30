import { VoyageAIClient } from "voyageai";
import Document from "../models/Document.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const voyage = process.env.VOYAGE_API_KEY
  ? new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY })
  : null;

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export const searchDocuments = async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;

    //  Validate input length
    if (!query?.trim() || query.trim().length < 10) {
      return res.status(400).json({
        success: false,
        query,
        answer: "✨ Please enter a meaningful question (at least 10 characters).",
        results: [],
      });
    }

    if (!voyage) throw new Error("VoyageAI client not initialized.");

    // Generate embedding for query
    const embeddingResp = await voyage.embed({
      model: "voyage-2",
      input: [query.trim()],
    });
    const queryEmbedding = embeddingResp?.data?.[0]?.embedding;
    if (!queryEmbedding) throw new Error("Failed to generate embedding.");

    //  Vector search
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
      { $match: { similarity: { $gte: 0.68 } } },
      { $sort: { similarity: -1 } },
      { $limit: parseInt(limit) },
      { $project: { _id: 1, title: 1, text: 1, similarity: 1 } },
    ]);

    //  Fallback: Keyword Search
    let keywordResults = [];
    if (vectorResults.length === 0) {
      keywordResults = await Document.find(
        { $text: { $search: `"${query}"` } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit);

      keywordResults = keywordResults.filter((d) => d.score > 1.5);
    }

    //  Combine results
    const topDocs = vectorResults.length > 0 ? vectorResults : keywordResults;

    //  Generate Answer with Gemini
    let answer = "No relevant information found. Please ask about CSEC ASTU I am assistant to give you information about CSEC ASTU✌️";
    if (gemini && topDocs.length > 0) {
      try {
        const context = topDocs.map((d) => `${d.title}\n${d.text}`).join("\n\n");
        const model = gemini.getGenerativeModel({ model: "gemini-2.5-pro" });

        const response = await model.generateContent(
          `You are a factual assistant. Use the context below to answer concisely and accurately.
          Context:
          ${context}
          Question:
          ${query}
          Answer in 1-2 sentences.`
        );

        answer = response.response.text().trim();
        answer = `✨ ${answer.replace(/\*\*/g, "").replace(/#+/g, "")}`;
      } catch (err) {
        console.error(" Gemini error:", err.message);
        answer = "Gemini failed to generate a response.";
      }
    }

    //  Return results
    res.status(200).json({
      success: true,
      query,
      totalResults: topDocs.length,
      results: topDocs,
      answer,
    });
  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
