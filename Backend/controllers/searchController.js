import { VoyageAIClient } from "voyageai";
import Document from "../models/Document.js";
import OpenAI from "openai";



if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is not defined. OpenAI features will be disabled.");
}

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export const searchDocuments = async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ message: "Valid query string is required" });
    }

    // Embed the query using VoyageAI
    const embeddingResponse = await voyage.embed({
      model: "voyage-2",
      input: [query.trim()],
    });

    if (!embeddingResponse?.data?.[0]?.embedding) {
      return res.status(500).json({ message: "Failed to generate query embedding" });
    }

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Vector similarity search in MongoDB
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
              in: {
                $divide: [
                  "$$dot",
                  { $multiply: ["$$normA", "$$normB"] },
                ],
              },
            },
          },
        },
      },
      { $sort: { similarity: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // Generate answer using OpenAI if results found and OpenAI is available
    let answer = null;
    if (results.length > 0 && openai) {
      const context = results.map((doc) => doc.text).join("\n");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion: ${query}`,
          },
        ],
      });

      answer = completion.choices[0].message.content;
    } else if (!openai) {
      console.warn("⚠️ OpenAI not initialized. Skipping answer generation.");
    }

    res.status(200).json({ query, results, answer });
  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};