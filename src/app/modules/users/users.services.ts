import httpStatus from "http-status";
import prisma from "../../lib/prisma";
import ApiError from "../../errors/ApiError";
import { S3Uploader } from "../../lib/S3Uploader";

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
