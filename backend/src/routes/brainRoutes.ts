import { Router } from "express";
import {
  shareBrain,
  revokeShare,
  getSharedBrain,
} from "../controllers/brainController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Private endpoints to manage sharing
router.post("/share", authMiddleware, shareBrain);
router.delete("/share", authMiddleware, revokeShare);

// Public endpoint to access a shared brain
router.get("/:shareLink", getSharedBrain);

export default router;
