import httpStatus from "http-status";
import { Role } from "@prisma/client";
import prisma from "../../lib/prisma";
import ApiError from "../../errors/ApiError";
import { S3Uploader } from "../../lib/S3Uploader";

// Only ADMIN/SUPERADMIN may update these access-control fields on their own profile
const ADMIN_ONLY_PROFILE_FIELDS = [
  "is_dimensions",
  "is_ai_virtual",
  "is_mannequin",
  "is_background_removal",
  "is_model",
  "is_image_diagram",
  "is_full_access",
] as const;

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      location: true,
      image: true,
      role: true,
      gender: true,
      is_dimensions: true,
      is_ai_virtual: true,
      is_mannequin: true,
      is_background_removal: true,
      is_model: true,
      is_image_diagram: true,
      type: true,
      is_full_access: true,
    },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  return user;
};

// update my profile
const updateMyProfile = async (userId: string, payload: any, file: any) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isUserExist) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  if (isUserExist.role === Role.USER) {
    const forbiddenField = ADMIN_ONLY_PROFILE_FIELDS.find(
      (field) => payload[field] !== undefined,
    );

    if (forbiddenField) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        `You are not allowed to update "${forbiddenField}"`,
      );
    }
  }

  if (file) {
    try {
      payload.image = isUserExist.image;
      // upload to s3
      const s3Response = await S3Uploader.uploadToS3(file, "users");
      payload.image = s3Response.Location;
    } catch (error) {
      console.log(error);
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to upload image",
      );
    }
  }

  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: payload,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      location: true,
      image: true,
      role: true,
    },
  });

  return user;
};

export const UsersService = {
  getMyProfile,
  updateMyProfile,
};
