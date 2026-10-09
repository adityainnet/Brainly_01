import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db";
import { PORT, CORS_ORIGIN } from "./config";
import apiRouter from "./routes";

const app = express();

// Middlewares
app.use(
  cors({
    origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(","),
    credentials: true,
  })
);
app.use(express.json());

// Basic health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Main API v1 router
app.use("/api/v1", apiRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ message: "Malformed JSON payload" });
    return;
  }

  res.status(err.status || 500).json({
    message: err.message || "An unexpected internal server error occurred",
  });
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Second Brain backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

void startServer();

export default app;