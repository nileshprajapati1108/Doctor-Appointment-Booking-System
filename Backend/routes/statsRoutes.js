import express from "express";
import { getPublicStats } from "../controllers/statsController.js";

const router = express.Router();

// Public stats used by frontend homepage
router.get("/", getPublicStats);

export default router;
