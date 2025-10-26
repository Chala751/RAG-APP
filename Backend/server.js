import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import embedRoutes from "./routes/embedRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

// Load .env file with explicit path
const envPath = "D:/MERN Stack projects/rag-app/Backend/.env";
const result = dotenv.config({ path: envPath });

// Debug dotenv loading
if (result.error) {
  console.error("❌ Error loading .env file:", result.error);
  throw result.error;
} else {
  console.log("✅ .env file loaded successfully");
  //console.log("Parsed env variables:", result.parsed);
}

connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/api", embedRoutes);
app.use("/api", searchRoutes);

app.get("/", (req, res) => {
  res.send("server is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));