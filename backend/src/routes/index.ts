import { Router } from "express";
import authRoutes from "./authRoutes";
import contentRoutes from "./contentRoutes";
import tagRoutes from "./tagRoutes";
import brainRoutes from "./brainRoutes";
import aiRoutes from "./aiRoutes";

const apiRouter = Router();

apiRouter.use("/", authRoutes);
apiRouter.use("/content", contentRoutes);
apiRouter.use("/tags", tagRoutes);
apiRouter.use("/brain", brainRoutes);
apiRouter.use("/ai", aiRoutes);

export default apiRouter;
