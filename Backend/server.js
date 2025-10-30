
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
const allowedOrigins = [
  "http://localhost:5173",          // local dev
  "https://rag-app-omega.vercel.app", 
 " https://rag-app-git-main-chala751s-projects.vercel.app",
  "https://rag-3tdhnma3w-chala751s-projects.vercel.app" // your deployed frontend
 
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Routes
app.use("/api", embedRoutes.default);
app.use("/api", searchRoutes.default);
app.use("/api/admin", (await import("./routes/adminRoutes.js")).default);


app.get("/", (req, res) => {
  res.send("server is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));