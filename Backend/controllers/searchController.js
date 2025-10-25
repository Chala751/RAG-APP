import { VoyageAIClient } from "voyageai";
import Document from "../models/Document.js";
import OpenAI from "openai";


const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


export const searchDocuments = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: "Query is required" });

    // Embed the query using VoyageAI
    const embeddingResponse = await voyage.embed({
      model: "voyage-2",
      input: [query], // must be an array
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Vector similarity search in MongoDB using cosine similarity
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
      { $limit: 5 }, 
    ]);

    //  Generate answer using OpenAI if results found
    let answer = null;
    if (results.length > 0) {
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
    }

    res.status(200).json({ query, results, answer });
  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
