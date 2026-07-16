import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import prisma from "../../lib/prisma";

interface IModelPositionPayload {
  position?: string[];
}

// Create Model Position
const createModelPosition = async (payload: IModelPositionPayload) => {
  const isExist = await prisma.modelPosition.findFirst();

  if (isExist) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Model position already created, please update instead"
    );
  }

  const result = await prisma.modelPosition.create({
    data: {
      position: payload.position || [],
    },
  });

  return result;
};

// Get Model Position
const getModelPosition = async () => {
  const result = await prisma.modelPosition.findFirst();

  return result;
};

// Update Model Position
const updateModelPosition = async (
  id: string,
  payload: IModelPositionPayload
) => {
  const isExist = await prisma.modelPosition.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Model position not found");
  }

  const result = await prisma.modelPosition.update({
    where: {
      id,
    },
    data: {
      position: payload.position,
    },
  });

  return result;
};

// Delete Model Position
const deleteModelPosition = async (id: string) => {
  const isExist = await prisma.modelPosition.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Model position not found");
  }

  const result = await prisma.modelPosition.delete({
    where: {
      id,
    },
  });

  return result;
};

export const ModelPositionService = {
  createModelPosition,
  getModelPosition,
  updateModelPosition,
  deleteModelPosition,
};
