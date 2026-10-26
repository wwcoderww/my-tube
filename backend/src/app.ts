import cors from "cors";
import express from "express";
import videoRoutes from "./routes/video.js";

export const app = express();

app.use("/api/video", videoRoutes);

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());
