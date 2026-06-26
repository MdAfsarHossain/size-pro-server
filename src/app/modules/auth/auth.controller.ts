import httpStatus from "http-status";
import sendResponse from "../../helpers/sendResponse";
import { AuthServices } from "./auth.service";
import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { JwtPayload } from "jsonwebtoken";

// ======================================
// ACCOUNT CREATION & REGISTRATION
// ======================================
const createAccount = catchAsync(async (req, res) => {
  const result = await AuthServices.createAccount(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: result.message,
    data: result,
  });
});

const verifiedEmail = catchAsync(async (req, res) => {
  const { userId, otpCode, type } = req.body;
  const result: any = await AuthServices.verifyEmail(userId, { otpCode, type });

  if (result.statusCode) {
    const { statusCode, message, ...data } = result;
    return sendResponse(res, {
      statusCode,
      message,
      data: data,
    });
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "OTP verified successfully",
    data: result,
  });
});

const resendOtp = catchAsync(async (req, res) => {
  const userId = req.body.userId;
  const result: any = await AuthServices.resendOtp(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "OTP verified successfully",
    data: result,
  });
});

const addAdmin = catchAsync(async (req, res) => {
  const result = await AuthServices.addAdmin(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: result.message,
    data: result,
  });
});

// ======================================
// AUTHENTICATION
// ======================================
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUserFromDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User logged in successfully",
    data: result,
  });
});

const adminLoginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.adminLoginUserFromDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User logged in successfully",
    data: result,
  });
});

// ======================================
// PASSWORD MANAGEMENT
// ======================================
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result,
  });
});

const verifyOtp = catchAsync(async (req, res) => {
  const result: any = await AuthServices.verifyOtp(req.body);

  if (result.statusCode) {
    const { statusCode, message, ...data } = result;
    return sendResponse(res, {
      statusCode,
      message,
      data: data,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "OTP verified successfully please reset your password",
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).id;
  const { newPassword, confirmPassword } = req.body;

  const result = await AuthServices.resetPassword(
    userId,
    newPassword,
    confirmPassword,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Password Reset successfully please login",
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const userId: string = req.user.id;
  const { oldPassword, newPassword } = req.body;

  const result = await AuthServices.changePassword(userId, {
    newPassword,
    oldPassword,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Password changed successfully",
    data: result,
  });
});

// ======================================
// EXPORT
// ======================================
export const AuthControllers = {
  createAccount,
  loginUser,
  forgotPassword,
  resetPassword,
  changePassword,
  verifiedEmail,
  adminLoginUser,
  resendOtp,
  verifyOtp,
  addAdmin,
};
