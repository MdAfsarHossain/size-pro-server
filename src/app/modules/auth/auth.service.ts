import * as bcrypt from "bcrypt";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../errors/ApiError";
import sentEmailUtility from "../../utils/sentEmailUtility";
import prisma from "../../lib/prisma";
import {
  IChangePassword,
  IOtp,
  IRegisterUser,
  IUserLogin,
} from "./auth.interface ";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import { Role, UserStatus } from "@prisma/client";
import { emailTemplate } from "../../utils/emailNotifications/emailHTML";
import { OTPFn } from "./OTPFn";
import { forgotEmailTemplate } from "../../utils/emailNotifications/forgotHTML";

// ======================================
// ACCOUNT CREATION & REGISTRATION
// ======================================
const createAccount = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  fcmToken?: string;
}) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, "This email is already registered");
  }

  const hashedPassword: string = await bcrypt.hash(payload.password, 12);

  const userData = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email.trim(),
    password: hashedPassword,
    role: payload.role || Role.USER,
    fcmToken: payload.fcmToken || undefined,
  };

  const result = await prisma.$transaction(async (transactionClient: any) => {
    const user = await transactionClient.user.create({
      data: userData,
    });

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      message: "User Registered successfully",
      type: "register",
    };
  });

  return result;
};

const verifyEmail = async (
  userId: string,
  {
    otpCode,
    fcmToken,
    type,
  }: { otpCode: string; fcmToken?: string; type: string },
) => {
  const otpRecord = await prisma.oTP.findUnique({
    where: { userId_otpCode: { userId, otpCode } },
  });

  if (!otpRecord) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP or expired OTP");
  }

  if (otpRecord.expiry < new Date()) {
    await prisma.oTP.delete({ where: { id: otpRecord.id } });
    throw new ApiError(httpStatus.REQUEST_TIMEOUT, "OTP expired");
  }

  const user = await prisma.$transaction(async (prisma) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    // Delete OTP record after successful verification
    await prisma.oTP.deleteMany({ where: { userId } });

    const accessToken: string = jwtHelpers.generateToken(
      { id: user.id },
      config.jwt.reset_pass_secret as Secret,
      config.jwt.reset_pass_token_expires_in as string,
    );

    return user;
  });

  return user;
};

const resendOtp = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User Not found");
  }

  OTPFn(
    existingUser.email,
    existingUser.id,
    "email Verification code",
    emailTemplate,
  );

  return {
    userId: existingUser.id,
    otpSent: true,
    name: true,
    message: "OTP sent successfully to your email",
  };
};

// Add new Admin
const addAdmin = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  fcmToken?: string;
}) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    // throw new ApiError(httpStatus.CONFLICT, "This email is already registered");
    if (existingUser.role === Role.ADMIN) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "This email is already registered",
      );
    } else if (existingUser.role === Role.USER) {
      const result = await prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          role: Role.ADMIN,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      });
      return {
        ...result,
        message: "User promoted to Admin successfully",
        type: "update",
      };
    }
  }

  const hashedPassword: string = await bcrypt.hash(payload.password, 12);

  const userData = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email.trim(),
    password: hashedPassword,
    role: payload.role || Role.USER,
    fcmToken: payload.fcmToken || undefined,
  };

  const result = await prisma.$transaction(async (transactionClient: any) => {
    const user = await transactionClient.user.create({
      data: userData,
    });

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      message: "User Registered successfully",
      type: "register",
    };
  });

  return result;
};

// ======================================
// AUTHENTICATION
// ======================================
const loginUserFromDB = async (payload: IUserLogin) => {
  const userData = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (userData.status === UserStatus.BLOCKED) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your account is not active. Please contact with admin.",
    );
  }

  if (userData.status === UserStatus.SUSPENDED) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your account is suspended. Please contact with admin.",
    );
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    userData.password as string,
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect");
  }

  // Update FCM token if provided
  if (payload.fcmToken) {
    await prisma.user.update({
      where: { id: userData.id },
      data: { fcmToken: payload.fcmToken },
    });
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email as string,
      role: userData.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  return {
    id: userData.id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    role: userData.role,
    image: userData.image,
    status: userData.status,
    accessToken: accessToken,
  };
};

const adminLoginUserFromDB = async (payload: IUserLogin) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
      OR: [{ role: Role.ADMIN }, { role: Role.SUPERADMIN }],
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    userData.password as string,
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect");
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email as string,
      role: userData.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string,
  );

  return {
    id: userData.id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    role: userData.role,
    image: userData.image,
    status: userData.status,
    accessToken: accessToken,
  };
};

// ======================================
// PASSWORD MANAGEMENT
// ======================================
const forgotPassword = async (payload: { email: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }

  OTPFn(user.email, user.id, "Forgot Password OTP email", forgotEmailTemplate);

  return {
    id: user.id,
    name: true,
    otpSent: true,
    message: "OTP sent successfully to your email",
    type: "forgotPassword",
  };
};

const verifyOtp = async (payload: IOtp) => {
  const { userId, otpCode } = payload;

  const otpData = await prisma.oTP.findUnique({
    where: { userId_otpCode: { userId, otpCode } },
  });

  if (!otpData) {
    throw new ApiError(httpStatus.NOT_FOUND, "OTP not found");
  }

  if (otpData.expiry < new Date()) {
    throw new ApiError(httpStatus.REQUEST_TIMEOUT, "OTP expired");
  }

  await prisma.oTP.delete({ where: { id: otpData.id } });

  const accessToken = jwtHelpers.generateToken(
    { id: userId },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_token_expires_in as string,
  );

  return { accessToken };
};

const resetPassword = async (
  userId: string,
  newPassword: string,
  confirmPassword: string,
) => {
  if (newPassword !== confirmPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "New Password and Confirm Password don't match.",
    );
  }

  const hashedPassword: string = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return {
    message: "Password Changed. Please Login.",
  };
};

const changePassword = async (userId: string, payload: IChangePassword) => {
  // if (payload.newPassword !== payload.confirmPassword) {
  //   throw new ApiError(
  //     httpStatus.CONFLICT,
  //     "newPassword and confirmPassword doesn't matched.",
  //   );
  // }

  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, email: true, id: true, status: true },
  });

  if (!userData) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found!, If you have already have account please reset your password",
    );
  }

  if (userData.status === UserStatus.BLOCKED) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your account has been blocked. Please contact support.",
    );
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.oldPassword,
    userData.password as string,
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Credentials not matched");
  }

  const hashedPassword: string = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  if (!updatedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found in the database.");
  }

  return {
    message: "Password changed successfully",
  };
};

// ======================================
// EXPORT
// ======================================
export const AuthServices = {
  createAccount,
  loginUserFromDB,
  verifyEmail,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  adminLoginUserFromDB,
  resendOtp,
  addAdmin,
};
