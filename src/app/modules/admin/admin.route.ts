import { Router } from "express";
import { AdminControllers } from "./admin.controller";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";

const router = Router();

// All admin
router.get("/all-admin", auth(Role.SUPERADMIN), AdminControllers.getAllAdmin);

// Get Single Admin
router.get(
  "/single-admin/:id",
  auth(Role.SUPERADMIN),
  AdminControllers.getSingleAdmin,
);

// Remove Admin
router.delete(
  "/remove-admin/:id",
  auth(Role.SUPERADMIN),
  AdminControllers.removeAdmin,
);

// Add Social Media
router.post(
  "/add-social-media",
  auth(Role.SUPERADMIN),
  AdminControllers.addSocialMedia,
);

// Update Social Media
router.put(
  "/update-social-media/:id",
  auth(Role.SUPERADMIN),
  AdminControllers.updateSocialMedia,
);

// Get Social Media
router.get(
  "/get-social-media",
  auth(Role.SUPERADMIN),
  AdminControllers.getSocialMedia,
);

// Get Recent Activity
router.get(
  "/recent-activity",
  auth(Role.SUPERADMIN),
  AdminControllers.getRecentActivity,
);

// Admin Dashboard Overview
router.get(
  "/admin-dashboard-overview",
  auth(Role.SUPERADMIN),
  AdminControllers.adminDashboardOverview,
);

export const AdminRouters = router;
