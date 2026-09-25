import { Router } from "express";
import { AdminControllers } from "./admin.controller";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";

const router = Router();

// All admin
router.get(
  "/all-admin",
  auth(Role.SUPERADMIN, Role.ADMIN),
  AdminControllers.getAllAdmin,
);

// Get Single Admin
router.get(
  "/single-admin/:id",
  auth(Role.SUPERADMIN, Role.ADMIN),
  AdminControllers.getSingleAdmin,
);

// Remove Admin/User (SUPERADMIN can remove ADMIN & USER; ADMIN can only remove USER)
router.delete(
  "/remove-admin/:id",
  auth(Role.SUPERADMIN, Role.ADMIN),
  AdminControllers.removeAdmin,
);

// Update Admin/User (SUPERADMIN can update ADMIN & USER; ADMIN can only update USER)
router.patch(
  "/update-user/:id",
  auth(Role.SUPERADMIN, Role.ADMIN),
  AdminControllers.updateAdminOrUser,
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
