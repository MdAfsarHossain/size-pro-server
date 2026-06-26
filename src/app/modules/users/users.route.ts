import express from "express";
import auth from "../../middlewares/auth";
import { UsersController } from "./users.controller";
import { fileUploader } from "../../middlewares/multerFileUpload";
import parseBodyData from "../../middlewares/parseBodyData";

const router = express.Router();

// ======================================
// USER PROFILE ROUTES
// ======================================

// Get my profile
router.get("/me", auth(), UsersController.getMyProfile);

// Update my profile
router.patch(
  "/profile",
  auth(),
  fileUploader.uploadImage,
  parseBodyData,
  UsersController.updateMyProfile,
);

// ======================================
// EXPORT
// ======================================
export const UsersRoutes = router;
