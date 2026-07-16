import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { ModelPositionService } from "./modelPosition.service";

const createModelPosition = catchAsync(async (req: Request, res: Response) => {
  const result = await ModelPositionService.createModelPosition(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Model position created successfully!",
    data: result,
  });
});

const getModelPosition = catchAsync(async (req: Request, res: Response) => {
  const result = await ModelPositionService.getModelPosition();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Model position fetched successfully!",
    data: result,
  });
});

const updateModelPosition = catchAsync(async (req: Request, res: Response) => {
  const result = await ModelPositionService.updateModelPosition(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Model position updated successfully!",
    data: result,
  });
});

const deleteModelPosition = catchAsync(async (req: Request, res: Response) => {
  const result = await ModelPositionService.deleteModelPosition(
    req.params.id
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Model position deleted successfully!",
    data: result,
  });
});

export const ModelPositionController = {
  createModelPosition,
  getModelPosition,
  updateModelPosition,
  deleteModelPosition,
};
