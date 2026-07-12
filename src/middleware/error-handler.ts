import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : "INTERNAL_ERROR";
  const message =
    isAppError || env.NODE_ENV !== "production"
      ? err.message
      : "Internal server error";

  if (!isAppError) {
    console.error(err);
  }

  res.status(statusCode).json({ error: { code, message } });
};
