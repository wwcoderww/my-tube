import express from "express";
const router = express.Router();
import metadataController from "../controllers/metadata.js";
import streamController from "../controllers/stream.js";
import downloadController from "../controllers/download.js";

router.get("/metadata/:id", metadataController);
router.get("/stream/:id", streamController);
router.get("/download", downloadController);

export default router;
