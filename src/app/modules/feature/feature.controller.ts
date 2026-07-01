import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { FeatureServices } from "./feature.service";
import sendResponse from "../../helpers/sendResponse";
import httpStatus from "http-status";

// Create Feature
const createFeature = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await FeatureServices.createFeature(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Feature created successfully",
    data: result,
  });
});

// Get Last Feature
const getLastFeature = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await FeatureServices.getFastFeature();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Feature retrieved successfully",
    data: result,
  });
});

// Update Feature
const updateFeature = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const id = req.params.id;

  const result = await FeatureServices.updateFeature(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Feature updated successfully",
    data: result,
  });
});

export const FeatureController = {
  createFeature,
  getLastFeature,
  updateFeature,
};
