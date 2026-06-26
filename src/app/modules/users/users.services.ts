import httpStatus from "http-status";
import prisma from "../../lib/prisma";
import ApiError from "../../errors/ApiError";
import { S3Uploader } from "../../lib/S3Uploader";

const getMyProfile = async (userId: string) => {
  // console.log(user);
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
      // socialMedia: true,
      image: true,
      role: true,
    },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

  // const socialMedia = await prisma.socialMedia.findFirst({});
  // console.log(socialMedia);

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

  // const imageFile = file.image ? file.image[0] : null;
  // console.log(imageFile);

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

  // console.log(payload);
  // image: '/home/afsarhossain/AfsarHossain/Dec25/ajpropl-server/public/uploads/Afsar-1770272229134.jpg'
  // Split the string by / and get the last element
  // const image = payload.image.split("public/").pop();
  // payload.image = image;

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
      // socialMedia: true,
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
