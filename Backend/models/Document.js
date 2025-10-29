import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: { type: String },
    text: { type: String, required: true },
    chunkIndex: { type: Number },      
    chunkSize: { type: Number },       
    keywords: { type: [String] },      
    embedding: {
      type: [Number],
      required: true,
      index: "vector",
      dimensions: 1536,
      similarity: "cosine",
    },
  },
  { timestamps: true }                 
);

// Create a MongoDB text index for keyword search
documentSchema.index({ text: "text", keywords: "text", title: "text" });

export default mongoose.model("Document", documentSchema);
