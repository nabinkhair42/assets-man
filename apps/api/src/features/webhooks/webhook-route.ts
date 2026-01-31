import { Router, type IRouter } from "express";
import * as webhookController from "./webhook-controller.js";

export const webhookRouter: IRouter = Router();

webhookRouter.post("/resend", webhookController.resendWebhook);
