import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  embedding: {
    type: [Number],
    required: true,
    
    index: "vector",
    dimensions: 1536, 
    similarity: "cosine",
  },
});

export default mongoose.model("Document", documentSchema);
