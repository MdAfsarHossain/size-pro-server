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

const parseProductVendorsCsv = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Please upload a CSV file!");
    }

    const result = await CsvService.parseProductVendorsCsv(req.file);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "CSV parsed and logged successfully!",
      data: result,
    });
  },
);

const crateProductVendor = catchAsync(async (req: Request, res: Response) => {
  const { productVendors } = req.body;
  const result = await CsvService.crateProductVendor(productVendors);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product vendors created successfully!",
    data: result,
  });
});

const getProductVendor = catchAsync(async (req: Request, res: Response) => {
  const result = await CsvService.getProductVendor();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product vendors retrieved successfully!",
    data: result,
  });
});

const deleteProductVendor = catchAsync(async (req: Request, res: Response) => {
  const result = await CsvService.deleteProductVendor();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Product vendors deleted successfully!",
    data: result,
  });
});

export const CsvController = {
  uploadCsv,
  parseProductVendorsCsv,
  crateProductVendor,
  getProductVendor,
  deleteProductVendor,
};
