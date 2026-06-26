import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import httpStatus from "http-status";
import { AdminServices } from "./admin.service";

// All admin
const getAllAdmin = catchAsync(async (req: Request, res: Response) => {
  const { page, limit } = req.query;

  // console.log(page, limit);

  const result = await AdminServices.getAllAdmin(
    page as string,
    limit as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All admin fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

// Get Single Admin
const getSingleAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page, limit, searchTerm } = req.query;

  const result = await AdminServices.getSingleAdmin(
    id,
    page as string,
    limit as string,
    searchTerm as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Single admin fetched successfully",
    data: result?.data ? result.data : result,
    meta: result?.meta,
  });
});

// Remove Admin
const removeAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await AdminServices.removeAdmin(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Admin removed successfully",
    data: result,
  });
});

// Add Social Media
const addSocialMedia = catchAsync(async (req: Request, res: Response) => {
  const data = req.body;

  const result = await AdminServices.addSocialMedia(data);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Social media added successfully",
    data: result,
  });
});

// Update Social Media
const updateSocialMedia = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const result = await AdminServices.updateSocialMedia(id, data);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Social media updated successfully",
    data: result,
  });
});

// Get Social Media
const getSocialMedia = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.getSocialMedia();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Social media fetched successfully",
    data: result,
  });
});

// Get Recent Activity
const getRecentActivity = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, sortBy, sortOrder, search } = req.query;

  const result = await AdminServices.getRecentActivity({
    page,
    limit,
    sortBy,
    sortOrder,
    search,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recent activity fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

// Admin Dashboard Overview
const adminDashboardOverview = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminServices.adminDashboardOverview();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin dashboard overview fetched successfully",
      data: result,
    });
  },
);

export const AdminControllers = {
  getAllAdmin,
  getSingleAdmin,
  removeAdmin,
  addSocialMedia,
  updateSocialMedia,
  getSocialMedia,
  getRecentActivity,
  adminDashboardOverview,
};
