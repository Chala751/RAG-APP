import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import embedRoutes from "./routes/embedRoutes.js";


dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.use(cors());

// Routes
app.use("/api", embedRoutes);





app.get("/", (req, res) => {
  res.send("server is running...");
});

const PORT = process?.env?.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));