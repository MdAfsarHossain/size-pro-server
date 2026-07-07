import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import prisma from "../../lib/prisma";

// Create Feature
const createFeature = async (payload: any) => {
  const result = await prisma.feature.create({
    data: {
      size: payload.size || [],
      categoryEnglish: payload.categoryEnglish || [],
      categoryPolish: payload.categoryPolish || [],
      vendorsEnglish: payload.vendorsEnglish || [],
      vendorPolish: payload.vendorPolish || [],
      fabricEnglish: payload.fabricEnglish || [],
      fabricPolish: payload.fabricPolish || [],
      genderEnglish: payload.genderEnglish || [],
      genderPolish: payload.genderPolish || [],
      colorsEnglish: payload.colorsEnglish || [],
      colorsPolish: payload.colorsPolish || [],
      conditionEnglish: payload.conditionEnglish || [],
      conditionPolish: payload.conditionPolish || [],
      featureEnglish: payload.featureEnglish || [],
      featurePolish: payload.featurePolish || [],
      isPublished: payload.isPublished || false,
      status: payload.status || "active",
      customFields: payload.customFields || {},
    },
  });
  return result;
};

// Get Last Feature (Most Recent)
const getFastFeature = async () => {
  const result = await prisma.feature.findFirst({
    orderBy: {
      createdAt: "desc", // or updatedAt: 'desc'
    },
  });
  const productVendor = await prisma.productVendor.findFirst();
  const data = {
    ...result,
    productVendor: productVendor?.brands_name || [],
  };
  return data;
};

// Update Feature
const updateFeature = async (id: string, payload: any) => {
  const isExist = await prisma.feature.findUnique({
    where: {
      id,
    },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Feature Not found");
  }

  const updatedResult = await prisma.feature.update({
    where: {
      id,
    },
    data: {
      ...payload,
    },
  });

  return updatedResult;
};

export const FeatureServices = {
  createFeature,
  getFastFeature,
  updateFeature,
};
