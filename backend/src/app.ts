import express from "express";
import cors from "cors";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { config } from "./shared/config.js";
import { logger } from "./infrastructure/logger.js";
import routes from "./routes/index.js";
import { requestContext } from "./middleware/request-context.js";
import { apiRateLimit, authRateLimit } from "./middleware/rate-limit.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";

const configuredOrigins = (
  Array.isArray(config.CORS_ORIGIN) ? config.CORS_ORIGIN : [config.CORS_ORIGIN]
).flatMap((origin) =>
  String(origin)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean),
);

const defaultOrigins =
  config.NODE_ENV === "production"
    ? []
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3005",
        "http://localhost:3006",
        "http://localhost:5173",
        "http://localhost:19006",
      ];
const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])];

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(requestContext);
app.use((req, _res, next) => {
  logger.info(
    { requestId: req.requestId, method: req.method, path: req.path },
    "Request started",
  );
  next();
});
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));
app.use("/api/v1/auth", authRateLimit);
app.use("/api/v1", apiRateLimit);
app.use("/api/v1", routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
