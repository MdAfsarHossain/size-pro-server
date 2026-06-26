import { Request, Response } from "express";
import httpStatus from "http-status";
import { UsersService } from "./users.services";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";

// ======================================
// USER PROFILE CONTROLLERS
// ======================================

// Get my profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const data = await UsersService.getMyProfile(req.user.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Fetched profile successfully!",
    data: data,
  });
});

// Update my profile
const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  console.log(`File: `);
  console.log(req.file);

  const data = await UsersService.updateMyProfile(
    req.user.id as string,
    req.body,
    req.file,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Updated profile successfully!",
    data: data,
  });
});

// ======================================
// EXPORT
// ======================================
export const UsersController = {
  getMyProfile,
  updateMyProfile,
  // getSellerProfileById,
};
