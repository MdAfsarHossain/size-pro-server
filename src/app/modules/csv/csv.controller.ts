import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { CsvService } from "./csv.service";
import sendResponse from "../../helpers/sendResponse";
import ApiError from "../../errors/ApiError";

const uploadCsv = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please upload a CSV file!");
  }

  const result = await CsvService.parseAndLogCsv(req.file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "CSV parsed and logged successfully!",
    data: result,
  });
});

export const CsvController = {
  uploadCsv,
};