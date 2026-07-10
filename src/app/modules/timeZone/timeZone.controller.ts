import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { TimeZoneService } from "./timZone.service";

const getTimeZoneList = catchAsync(async (req: Request, res: Response) => {
  const result = await TimeZoneService.getTimeZoneList();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Client added successfully!",
    data: result,
  });
});

const getSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await TimeZoneService.getSettings();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Client added successfully!",
    data: result,
  });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await TimeZoneService.updateSettings(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Client added successfully!",
    data: result,
  });
});

export const TimeZoneController = {
  getTimeZoneList,
  getSettings,
  updateSettings
};