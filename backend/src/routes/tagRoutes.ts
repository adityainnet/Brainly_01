import { Router } from "express";
import { getTags, createTag, deleteTag } from "../controllers/tagController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", getTags);
router.post("/", createTag);
router.delete("/:id", deleteTag);

export default router;
