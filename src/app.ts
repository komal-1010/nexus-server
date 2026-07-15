import "dotenv/config";

import express from "express";
import helmet from "helmet";

import { authRouter } from "./routes/auth.routes.js";

const app = express();

app.use(helmet());

app.use(express.json());

app.use("/auth", authRouter);

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  },
);

app.listen(3000, () => {
  console.log("API listening on port 3000");
});