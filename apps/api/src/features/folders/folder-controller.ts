import type { Response } from "express";
import { sendSuccess, sendError } from "@/utils/response-utils.js";
import * as folderService from "./folder-services.js";
import type { AuthRequest } from "@/middleware/auth-middleware.js";
import type {
  CreateFolderInput,
  UpdateFolderInput,
  MoveFolderInput,
} from "@/schema/folder-schema.js";

export async function createFolder(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const input = req.body as CreateFolderInput;
    const folder = await folderService.createFolder(req.userId, input);
    sendSuccess(res, { folder }, "Folder created", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "PARENT_NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Parent folder not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to create folder", 500);
  }
}

export async function getFolder(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Folder ID is required", 400);
      return;
    }

    const folder = await folderService.getFolderById(req.userId, id);

    if (!folder) {
      sendError(res, "NOT_FOUND", "Folder not found", 404);
      return;
    }

    sendSuccess(res, { folder });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to get folder", 500);
  }
}

export async function getFolderContents(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const parentId = (req.query.parentId as string) || null;
    const folders = await folderService.getFolderContents(req.userId, parentId);
    sendSuccess(res, { folders });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to get folder contents", 500);
  }
}

export async function getAllFolders(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const folders = await folderService.getAllFolders(req.userId);
    sendSuccess(res, { folders });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to get folders", 500);
  }
}

export async function updateFolder(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Folder ID is required", 400);
      return;
    }

    const input = req.body as UpdateFolderInput;
    const folder = await folderService.updateFolder(req.userId, id, input);
    sendSuccess(res, { folder }, "Folder updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Folder not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to update folder", 500);
  }
}

export async function moveFolder(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Folder ID is required", 400);
      return;
    }

    const input = req.body as MoveFolderInput;
    const folder = await folderService.moveFolder(req.userId, id, input);
    sendSuccess(res, { folder }, "Folder moved");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Folder not found", 404);
      return;
    }

    if (message === "PARENT_NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Destination folder not found", 404);
      return;
    }

    if (message === "INVALID_MOVE") {
      sendError(res, "VALIDATION_ERROR", "Cannot move folder to this location", 400);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to move folder", 500);
  }
}

export async function deleteFolder(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Folder ID is required", 400);
      return;
    }

    await folderService.deleteFolder(req.userId, id);
    sendSuccess(res, null, "Folder deleted");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Folder not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to delete folder", 500);
  }
}

export async function toggleStarred(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Folder ID is required", 400);
      return;
    }

    const folder = await folderService.toggleStarred(req.userId, id);
    sendSuccess(res, { folder }, folder.isStarred ? "Folder starred" : "Folder unstarred");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Folder not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to toggle starred", 500);
  }
}

export async function listStarredFolders(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const folders = await folderService.listStarredFolders(req.userId);
    sendSuccess(res, { folders });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to list starred folders", 500);
  }
}
