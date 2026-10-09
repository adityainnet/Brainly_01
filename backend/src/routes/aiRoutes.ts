import { Router } from "express";
import {
  semanticSearch,
  getRecommendations,
  getConnections,
  getDigest,
  getAiHealth,
} from "../controllers/aiController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/health", getAiHealth);
router.post("/search", semanticSearch);
router.post("/recommendations", getRecommendations);
router.post("/connections", getConnections);
router.post("/digest", getDigest);

export default router;
