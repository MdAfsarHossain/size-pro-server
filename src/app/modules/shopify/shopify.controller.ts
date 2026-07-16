import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import ApiError from "../../errors/ApiError";
import { ShopifyService } from "./shopify.service";

const uploadProductsCsv = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please upload a CSV file!");
  }

  const result = await ShopifyService.createProductsFromCsv(req.file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "CSV processed and product(s) uploaded to Shopify",
    data: result,
  });
});

export const ShopifyController = {
  uploadProductsCsv,
};
