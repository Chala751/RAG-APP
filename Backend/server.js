
import dotenv from "dotenv";


dotenv.config({ path: "D:/MERN Stack projects/rag-app/Backend/.env" });


import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";


const embedRoutesPromise = import("./routes/embedRoutes.js");
const searchRoutesPromise = import("./routes/searchRoutes.js");
const adminRoutes = await import("./routes/adminRoutes.js");

const [embedRoutes, searchRoutes] = await Promise.all([embedRoutesPromise, searchRoutesPromise]);

connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/api", embedRoutes.default);
app.use("/api", searchRoutes.default);
app.use("/api/admin", (await import("./routes/adminRoutes.js")).default);


app.get("/", (req, res) => {
  res.send("server is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));