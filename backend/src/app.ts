import cors from "cors";
import express from "express";
import videoRoutes from "./routes/video.js";

export const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

app.use("/api/video", videoRoutes);
