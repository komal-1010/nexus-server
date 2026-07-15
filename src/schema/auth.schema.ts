import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must be at most 255 characters"),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255)
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255)
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Password must be at most 72 characters"),
});