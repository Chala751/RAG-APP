
import dotenv from "dotenv";

// Load .env file before any imports
dotenv.config({ path: "D:/MERN Stack projects/rag-app/Backend/.env" });

// Debug environment variables
console.log("✅ .env file loaded");
console.log("MONGO_URI:", process.env.MONGO_URI ? "Loaded" : "Not loaded");
console.log("VOYAGE_API_KEY:", process.env.VOYAGE_API_KEY ? "Loaded" : "Not loaded");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Loaded" : "Not loaded");
console.log("PORT:", process.env.PORT ? "Loaded" : "Not loaded");


import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";


const embedRoutesPromise = import("./routes/embedRoutes.js");
const searchRoutesPromise = import("./routes/searchRoutes.js");
import adminRoutes from "./routes/adminRoutes.js";

const [embedRoutes, searchRoutes] = await Promise.all([embedRoutesPromise, searchRoutesPromise]);

connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/api", embedRoutes.default);
app.use("/api", searchRoutes.default);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("server is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));