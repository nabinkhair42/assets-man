import { Router, type IRouter } from "express";
import * as authController from "./auth-controller.js";
import { validateBody } from "@/utils/request-validator.js";
import {
  registerSchema,
  registerSendOtpSchema,
  registerVerifyOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "@/schema/auth-schema.js";
import { authenticate } from "@/middleware/auth-middleware.js";

export const authRouter: IRouter = Router();

// Public routes
authRouter.post("/register", validateBody(registerSchema), authController.register);
authRouter.post("/register/send-otp", validateBody(registerSendOtpSchema), authController.registerSendOtp);
authRouter.post("/register/verify-otp", validateBody(registerVerifyOtpSchema), authController.registerVerifyOtp);
authRouter.post("/login", validateBody(loginSchema), authController.login);
authRouter.post("/refresh", authController.refreshToken);
authRouter.post("/logout", authController.logout);
authRouter.post("/forgot-password", validateBody(forgotPasswordSchema), authController.forgotPassword);
authRouter.post("/reset-password", validateBody(resetPasswordSchema), authController.resetPassword);
authRouter.post("/verify-email", validateBody(verifyEmailSchema), authController.verifyEmail);
authRouter.post("/resend-verification", validateBody(resendVerificationSchema), authController.resendVerification);

// Protected routes
authRouter.get("/me", authenticate, authController.me);
authRouter.patch("/profile", authenticate, validateBody(updateProfileSchema), authController.updateProfile);
authRouter.post("/change-password", authenticate, validateBody(changePasswordSchema), authController.changePassword);
authRouter.delete("/account", authenticate, validateBody(deleteAccountSchema), authController.deleteAccount);
