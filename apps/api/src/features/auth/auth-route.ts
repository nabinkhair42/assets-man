import { Router, type IRouter } from "express";
import * as authController from "./auth-controller.js";
import { validateBody } from "@/utils/request-validator.js";
import { registerSchema, loginSchema } from "@/schema/auth-schema.js";
import { authenticate } from "@/middleware/auth-middleware.js";

export const authRouter: IRouter = Router();

// Public routes
authRouter.post("/register", validateBody(registerSchema), authController.register);
authRouter.post("/login", validateBody(loginSchema), authController.login);
authRouter.post("/refresh", authController.refreshToken);
authRouter.post("/logout", authController.logout);

// Protected routes
authRouter.get("/me", authenticate, authController.me);
