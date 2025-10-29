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

    if (!query?.trim()) {
      return res.status(400).json({ message: "Please provide a valid query." });
    }

    // ===== Step 1: Lexical Search =====
    const keywordResults = await Document.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit);

    console.log(`🔍 Keyword results found: ${keywordResults.length}`);

    // ===== Step 2: Semantic (Vector) Search =====
    if (!voyage) throw new Error("VoyageAI client not initialized.");

    const embeddingResponse = await voyage.embed({
      model: "voyage-2",
      input: [query.trim()],
    });

    const queryEmbedding = embeddingResponse?.data?.[0]?.embedding;
    if (!queryEmbedding) throw new Error("Failed to generate embedding for query.");

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
      { $match: { similarity: { $gte: 0.75 } } },
      { $sort: { similarity: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          title: 1,
          text: 1,
          similarity: 1,
        },
      },
    ]);

    console.log(`🧠 Vector results found: ${vectorResults.length}`);

    // ===== Step 3: Merge Results =====
    const merged = [
      ...keywordResults.map((d) => ({
        _id: d._id,
        title: d.title,
        text: d.text,
        scoreType: "keyword",
        score: d.score ?? 0,
      })),
      ...vectorResults.map((d) => ({
        _id: d._id,
        title: d.title,
        text: d.text,
        scoreType: "vector",
        score: d.similarity ?? 0,
      })),
    ];

    // Deduplicate and rank
    const unique = Array.from(
      new Map(merged.map((d) => [d._id.toString(), d])).values()
    ).sort((a, b) => b.score - a.score);

    const topDocs = unique.slice(0, limit);

    // ===== Step 4: Generate Answer (Gemini) =====
    let answer = "No relevant information found.";

    if (gemini && topDocs.length > 0) {
      try {
        const context = topDocs
          .map((d) => `Title: ${d.title}\n${d.text}`)
          .join("\n\n");

        const model = gemini.getGenerativeModel({ model: "gemini-2.5-pro" });

        const response = await model.generateContent(
          `Use the context below to answer accurately.

          Context:
          ${context}

          Question:
          ${query}

          Provide a concise and factual answer.`
        );

        answer = response.response.text().trim();
        answer = `✨ ${answer.replace(/\*\*/g, "").replace(/#+/g, "")}`;
      } catch (err) {
        console.error("❌ Gemini error:", err.message);
        answer = "⚠️ Gemini failed to generate a response.";
      }
    }

    // ===== Step 5: Send Response =====
    return res.status(200).json({
      success: true,
      query,
      totalResults: topDocs.length,
      results: topDocs,
      answer,
    });
  } catch (error) {
    console.error("❌ Search error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
