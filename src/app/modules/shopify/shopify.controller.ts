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

  const { generatedImageId } = req.body;
  const result = await ShopifyService.createProductsFromCsv(req.file, generatedImageId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "CSV processed and product(s) uploaded to Shopify",
    data: result,
  });
});


const uploadMultipleProductsCsv = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  // console.log(files);
  // console.log(req.body);
  

  if (!files || !files.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please upload at least one CSV file!");
  }

  let generatedImageIds: (string | undefined)[] | undefined;

  const getIds = req.body?.generatedImageIds;
  if (getIds) {
    generatedImageIds = Array.isArray(getIds)
      ? (getIds as string[])
      : [getIds as string];
  }
  // return generatedImageIds;

  // if (req.body.generatedImageIds) {
  //   try {
  //     generatedImageIds = JSON.parse(req.body.generatedImageIds);
  //   } catch {
  //     throw new ApiError(
  //       httpStatus.BAD_REQUEST,
  //       "generatedImageIds must be a JSON-stringified array",
  //     );
  //   }
  // }

  const result = await ShopifyService.uploadMultipleProductsCsv(files, generatedImageIds);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "CSV processed and product(s) uploaded to Shopify",
    data: result,
  });
});

const getShopifyUploadHistory = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, success, generatedImageId } = req.query;

  const result = await ShopifyService.getShopifyUploadHistory({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    success: success !== undefined ? success === "true" : undefined,
    generatedImageId: generatedImageId as string | undefined,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Shopify upload history retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getShopifyUploadHistoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShopifyService.getShopifyUploadHistoryById(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Shopify upload history record retrieved successfully",
    data: result,
  });
});

export const ShopifyController = {
  uploadProductsCsv,
  uploadMultipleProductsCsv,
  getShopifyUploadHistory,
  getShopifyUploadHistoryById,
};
