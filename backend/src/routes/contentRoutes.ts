import { Router } from "express";
import {
  createContent,
  getContentList,
  getContentById,
  updateContent,
  deleteContent,
} from "../controllers/contentController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.post("/", createContent);
router.get("/", getContentList);
router.get("/:id", getContentById);
router.patch("/:id", updateContent);
router.delete("/:id", deleteContent);
router.delete("/", deleteContent);

export default router;
