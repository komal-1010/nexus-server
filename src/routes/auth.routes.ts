import bcrypt from "bcrypt";
import { Router } from "express";

import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { signAccessToken } from "../lib/jwt.js";
import { authRateLimiter } from "../middleware/auth-rate-limit.js";
import {
  loginSchema,
  registerSchema,
} from "../schemas/auth.schema.js";

export const authRouter = Router();

authRouter.use(authRateLimiter);

authRouter.post("/register", async (req, res, next) => {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        issues: result.error.flatten(),
      });
    }

    const { name, email, password } = result.data;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
      },
    });

    const userId = user.id.toString();

    const token = signAccessToken(userId);

    return res.status(201).json({
      user: {
        ...user,
        id: userId,
      },
      token,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        error: "EMAIL_ALREADY_REGISTERED",
        message: "An account with this email already exists",
      });
    }

    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    // 1. Validate input
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        issues: result.error.flatten(),
      });
    }

    const { email, password } = result.data;

    // 2. Find user by unique email
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        plan: true,
        createdAt: true,
      },
    });

    // 3. Use a generic auth error
    if (!user) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    }

    // 4. Verify password
    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    }

    // 5. Sign JWT
    const userId = user.id.toString();

    const token = signAccessToken(userId);

    // 6. Return safe user fields
    return res.status(200).json({
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        plan: user.plan,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});