import { Prisma, Role } from "@prisma/client";
import prisma from "../../lib/prisma";
import { createRedisClient } from "../../../config/redis";
import { DocumentServices } from "../document/document.service";
import { formatDateAndTime } from "../../utils/formatDate";
// import { createRedisClient } from "../../../config/redis";

// Global Redis client
let redisClient;

// All Admin
// const getAllAdmin = async (page: string, limit: string) => {
//   redisClient = await createRedisClient();

//   const pageNumber = parseInt(page) || 1;
//   const limitNumber = parseInt(limit) || 10;
//   const skip = (pageNumber - 1) * limitNumber;

//   const whereCondition = {
//     role: Role.ADMIN,
//   };

//   // Check Redis cache first [citation:1]
//   const cachedUser = await redisClient.get();

//   // const total = await prisma.user.count({
//   //   where: whereCondition,
//   // });

//   // const totalPages = Math.ceil(total / limitNumber);

//   if (cachedUser) {
//     console.log(`✅ Cache hit for`);
//     // return res.json(JSON.parse(cachedUser));

//     const total = await prisma.user.count({
//       where: whereCondition,
//     });

//     const totalPages = Math.ceil(total / limitNumber);

//     return {
//       data: cachedUser,
//       meta: {
//         page: pageNumber,
//         limit: limitNumber,
//         total: cachedUser.length,
//         hasNextPage: totalPages > pageNumber,
//         hasPrevPage: pageNumber > 1,
//         totalPages: totalPages,
//       },
//     };
//   }

//   // console.log(`❌ Cache miss for ${cacheKey}`);

//   const result = await prisma.user.findMany({
//     where: whereCondition,
//     select: {
//       id: true,
//       firstName: true,
//       lastName: true,
//       email: true,
//       role: true,
//       status: true,
//     },
//     skip: skip,
//     take: limitNumber,
//     orderBy: {
//       createdAt: "desc",
//     },
//   });

//   const total = await prisma.user.count({
//     where: whereCondition,
//   });

//   const totalPages = Math.ceil(total / limitNumber);

//   return {
//     data: result,
//     meta: {
//       page: pageNumber,
//       limit: limitNumber,
//       total: total,
//       hasNextPage: totalPages > pageNumber,
//       hasPrevPage: pageNumber > 1,
//       totalPages: totalPages,
//     },
//   };
// };

// Redis
const getAllAdmin = async (page: string, limit: string) => {
  const pageNumber = parseInt(page) || 1;
  const limitNumber = parseInt(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const whereCondition = {
    role: Role.ADMIN,
  };

  // Get Redis instance [citation:1]
  // const redisService = await RedisService.getInstance();
  // const redisClient = redisService.getClient();

  // const redisClient = await createRedisClient();
  // const cacheKey = `admins:page:${pageNumber}:limit:${limitNumber}`;

  // try {
  //   // Get the actual Redis client instance
  //   const redisClient = await createRedisClient();

  //   // Check Redis cache first
  //   const cachedData = await redisClient.get(cacheKey);

  //   if (cachedData) {
  //     console.log(`✅ Cache hit for ${cacheKey}`);
  //     const parsedData = JSON.parse(cachedData);

  //     const total = await prisma.user.count({
  //       where: whereCondition,
  //     });

  //     const totalPages = Math.ceil(total / limitNumber);

  //     return {
  //       data: parsedData,
  //       meta: {
  //         page: pageNumber,
  //         limit: limitNumber,
  //         total: total,
  //         hasNextPage: totalPages > pageNumber,
  //         hasPrevPage: pageNumber > 1,
  //         totalPage: totalPages,
  //       },
  //     };
  //   }

  //   console.log(`❌ Cache miss for ${cacheKey}`);

  //   // Fetch from database
  //   const result = await prisma.user.findMany({
  //     where: whereCondition,
  //     select: {
  //       id: true,
  //       firstName: true,
  //       lastName: true,
  //       email: true,
  //       role: true,
  //       status: true,
  //     },
  //     skip: skip,
  //     take: limitNumber,
  //     orderBy: {
  //       createdAt: "desc",
  //     },
  //   });

  //   const total = await prisma.user.count({
  //     where: whereCondition,
  //   });

  //   // Cache the result (5 minutes TTL)
  //   // await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
  //   await redisClient.setEx(cacheKey, 60, JSON.stringify(result));

  //   const totalPages = Math.ceil(total / limitNumber);

  //   return {
  //     data: result,
  //     meta: {
  //       page: pageNumber,
  //       limit: limitNumber,
  //       total: total,
  //       hasNextPage: totalPages > pageNumber,
  //       hasPrevPage: pageNumber > 1,
  //       totalPage: totalPages,
  //     },
  //   };
  // } catch (error) {
  //   console.error("Error in getAllAdmin:", error);
  //   throw error;
  // }

  // Fetch from database
  const result = await prisma.user.findMany({
    where: whereCondition,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
    },
    skip: skip,
    take: limitNumber,
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.user.count({
    where: whereCondition,
  });

  const totalPages = Math.ceil(total / limitNumber);

  return {
    data: result,
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total: total,
      hasNextPage: totalPages > pageNumber,
      hasPrevPage: pageNumber > 1,
      totalPage: totalPages,
    },
  };
};

// // Get Single Admin
// const getSingleAdmin = async (id: string) => {
//   const result = await prisma.user.findUnique({
//     where: {
//       id: id,
//     },
//     select: {
//       id: true,
//       firstName: true,
//       lastName: true,
//       email: true,
//       image: true,
//       location: true,
//       phone: true,
//       createdAt: true,
//       totalCreatedProducts: true,
//       totalGeneratedProducts: true,
//       documents: {
//         select: {
//           id: true,
//           title: true,
//           productType: true,
//           model: true,
//           // mannequin: true,
//           createdAt: true,
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//       },

//       //   location: true,
//       //   phone: true,
//       //   totalCreatedProducts: true,
//       //   totalGeneratedProducts: true,
//       //   fcmToken: true,
//       //   role: true,
//       //   status: true,
//       //   lastLogin: true,
//       //   createdAt: true,
//       //   updatedAt: true,
//     },
//   });
//   return result;
// };

// Get Single Admin with Redis caching
const getSingleAdmin = async (
  id: string,
  page?: string,
  limit?: string,
  searchTerm?: string,
) => {
  const pageNumber = parseInt(page as string) || 1;
  const limitNumber = parseInt(limit as string) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  // Create a unique cache key for this admin [citation:1]
  const cacheKey = `admin:${id}`;

  // try {
  //   // Check Redis cache first
  //   // Get the actual Redis client instance
  //   const redisClient = await createRedisClient();

  //   // Check Redis cache first
  //   const cachedData = await redisClient.get(cacheKey);

  //   // if (cachedData) {
  //   //   console.log(`✅ Cache hit for ${cacheKey}`);
  //   //   return JSON.parse(cachedData);
  //   // }

  //   console.log(`❌ Cache miss for ${cacheKey}`);

  //   // Fetch from database if not in cache
  //   const result = await prisma.user.findUnique({
  //     where: {
  //       id: id,
  //     },
  //     select: {
  //       id: true,
  //       firstName: true,
  //       lastName: true,
  //       email: true,
  //       image: true,
  //       location: true,
  //       phone: true,
  //       createdAt: true,
  //       totalCreatedProducts: true,
  //       totalGeneratedProducts: true,
  //       documents: {
  //         select: {
  //           id: true,
  //           // title: true,
  //           // productType: true,
  //           // model: true,
  //           // mannequin: true,
  //           createdAt: true,
  //         },
  //         orderBy: {
  //           createdAt: "desc",
  //         },
  //       },
  //     },
  //   });

  //   // If admin not found, return null (don't cache null values)
  //   if (!result) {
  //     return null;
  //   }

  //   // Store in Redis with expiration (e.g., 1 hour = 3600 seconds)
  //   // Use a shorter TTL for admin data that might change frequently
  //   // await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));

  //   return result;
  // } catch (error) {
  //   console.error(`Error in getSingleAdmin for ID ${id}:`, error);

  // Fallback: try to fetch from database if Redis fails

  const result = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
      location: true,
      phone: true,
      createdAt: true,
      totalCreatedProducts: true,
      totalGeneratedProducts: true,
      generatedImages: {
        select: {
          id: true,
          imageDetails: true, // Keep as true since it's JSON
          isDeleted: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!result) return null;

  let finalResult = result.generatedImages.map((document) => {
    // Parse imageDetails if it's a string, or use as is if it's already an object
    const imageDetails =
      typeof document.imageDetails === "string"
        ? JSON.parse(document.imageDetails)
        : document.imageDetails;

    // Extract product_title and category from the nested structure
    const product_title =
      imageDetails?.product_title ||
      imageDetails?.productTitle || // Alternative field name if exists
      null;

    const product_category =
      imageDetails?.product_details?.category ||
      imageDetails?.category || // Alternative field name if exists
      null;

    return {
      id: document.id,
      product_title,
      product_category,
      isPhysical: imageDetails?.isPhysical?.length > 0 || false,
      isAIVirtualTryOn: imageDetails?.virtual_tryon_urls?.length > 0 || false,
      isMannequin: imageDetails?.mannequin_urls?.length > 0 || false,
      isBackgroundRemoval:
        imageDetails?.background_removed_url?.length > 0 || false,
      isModel: imageDetails?.model_urls?.length > 0 || false,
      isImageDiagram: imageDetails?.image_diagram_url?.length > 0 || false,
      isDeleted: document.isDeleted,
      dateFormat: formatDateAndTime(document.createdAt),
    };
  });

  // Apply search filtering
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    finalResult = finalResult.filter(
      (img) =>
        (img.product_title &&
          img.product_title.toLowerCase().includes(searchLower)) ||
        (img.product_category &&
          img.product_category.toLowerCase().includes(searchLower)),
    );
  }

  const total = finalResult.length;
  const totalPages = Math.ceil(total / limitNumber);

  // Apply pagination
  const paginatedImages = finalResult.slice(skip, skip + limitNumber);

  return {
    data: {
      ...result,
      generatedImages: paginatedImages,
    },
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total: total,
      hasNextPage: totalPages > pageNumber,
      hasPrevPage: pageNumber > 1,
      totalPage: totalPages,
    },
  };
};
// };

// Remove Admin
// const removeAdmin = async (id: string) => {
//   // const result = await prisma.user.update({
//   //   where: {
//   //     id: id,
//   //   },
//   //   data: {
//   //     role: Role.USER,
//   //   },
//   //   select: {
//   //     id: true,
//   //     firstName: true,
//   //     lastName: true,
//   //     email: true,
//   //     image: true,
//   //   },
//   // });

//   const result = await prisma.user.delete({
//     where: {
//       id: id,
//     },
//     select: {
//       id: true,
//       firstName: true,
//       lastName: true,
//       email: true,
//       image: true,
//     },
//   });

//   // Invalidate caches
//   // const redisService = await RedisService.getInstance();

//   // Check Redis cache first
//   // Get the actual Redis client instance
//   const redisClient = await createRedisClient();

//   const cacheKey = `admin:${id}`;

//   // Check Redis cache first
//   const cachedData = await redisClient.get(cacheKey);

//   await Promise.all([
//     redisClient.del(`admin:${id}`), // Invalidate single admin cache
//     redisClient.delByPattern("admins:page:*"), // Invalidate all list caches
//   ]);

//   return result;
// };

// Remove Admin
const removeAdmin = async (id: string) => {
  // First check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
      role: true,
    },
  });

  if (!existingAdmin) {
    throw new Error("Admin not found");
  }

  // Optional: Check if user is actually an admin before deletion
  if (existingAdmin.role !== "ADMIN") {
    throw new Error("User is not an admin");
  }

  // Delete the admin
  const result = await prisma.user.delete({
    where: {
      id: id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
    },
  });

  // Invalidate caches in background (don't await to avoid blocking response)
  const redisClient = await createRedisClient();

  // Helper to invalidate cache by pattern
  const invalidatePattern = async (pattern: string) => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map((key: string) => redisClient.del(key)));
      }
    } catch (e) {
      console.error(`Failed to invalidate cache for pattern ${pattern}:`, e);
    }
  };

  // Fire and forget - cache invalidation shouldn't block the response
  Promise.all([
    redisClient.del(`admin:${id}`), // Invalidate single admin cache
    invalidatePattern("admins:page:*"), // Invalidate all list caches
    invalidatePattern("admin:*"), // Optional: Invalidate any other admin-related caches
  ]).catch((error) => {
    console.error("Failed to invalidate admin caches:", error);
  });

  return result;
};

// Add Social Media
const addSocialMedia = async (data: any) => {
  const result = await prisma.socialMedia.create({
    data: data,
  });
  return result;
};

// Update Social Media
const updateSocialMedia = async (id: string, data: any) => {
  const result = await prisma.socialMedia.update({
    where: {
      id: id,
    },
    data: data,
  });
  return result;
};

// Get Social Media
const getSocialMedia = async () => {
  const result = await prisma.socialMedia.findFirst({
    orderBy: {
      createdAt: "desc",
    },
  });
  return result;
};

// Recent Activity
// Recent Activity
// const getRecentActivity = async (
//   search: string,
//   page: string,
//   limit: string,
// ) => {
//   const pageNumber = parseInt(page) || 1;
//   const limitNumber = parseInt(limit) || 10;
//   const skip = (pageNumber - 1) * limitNumber;

//   // Build where condition for JSON field
//   const whereCondition: Prisma.GeneratedImageWhereInput = {
//     isDeleted: false, // Add this if you want to exclude deleted items
//   };

//   // Add search condition if search parameter is provided
//   if (search) {
//     whereCondition.imageDetails = {
//       path: ["product_title"], // Navigate to the nested field
//       string_contains: search, // Case-sensitive search
//       // OR use string_starts_with, string_ends_with as needed
//     };
//   }

//   const result = await prisma.generatedImage.findMany({
//     where: whereCondition,
//     orderBy: {
//       createdAt: "desc",
//     },
//     skip: skip,
//     take: limitNumber,
//   });

//   // Parse the JSON data in the response to access nested fields
//   const formattedResult = result.map((doc) => {
//     // Parse imageDetails if it's stored as a string, or use as is
//     const imageDetails =
//       typeof doc.imageDetails === "string"
//         ? JSON.parse(doc.imageDetails)
//         : doc.imageDetails;

//     return {
//       ...doc,
//       imageDetails, // Keep the parsed version
//       // Extract commonly used fields for easier access
//       product_title: imageDetails?.product_details?.product_title || null,
//       product_category: imageDetails?.product_details?.category || null,
//       selected_features: imageDetails?.selected_features || [],
//       generated_skus: imageDetails?.generated_skus || null,
//     };
//   });

//   const total = await prisma.generatedImage.count({
//     where: whereCondition,
//   });

//   const totalPages = Math.ceil(total / limitNumber);

//   return {
//     data: formattedResult,
//     meta: {
//       page: pageNumber,
//       limit: limitNumber,
//       total: total,
//       hasNextPage: totalPages > pageNumber,
//       hasPrevPage: pageNumber > 1,
//       totalPage: totalPages,
//     },
//   };
// };

// Recent Activity
// const getRecentActivity = async (
//   search: string,
//   page: string,
//   limit: string,
// ) => {
//   const pageNumber = parseInt(page) || 1;
//   const limitNumber = parseInt(limit) || 10;
//   const skip = (pageNumber - 1) * limitNumber;
//   const take = limitNumber;
//   console.log(pageNumber, limitNumber, skip, take);

//   // Build where condition
//   const whereCondition: Prisma.GeneratedImageWhereInput = {
//     isDeleted: false,
//   };

//   // For JSON field searching, we need to use raw query or filter after fetching
//   // Since Prisma doesn't support direct JSON field filtering well in all versions,
//   // we'll fetch all and filter in memory for search
//   const result = await prisma.generatedImage.findMany({
//     // where: {
//     //   isDeleted: false,
//     // },
//     where: whereCondition,
//     orderBy: {
//       createdAt: "desc",
//     },
//     skip: skip,
//     take: take,
//   });

//   console.log(result.length);

//   // Parse and filter the results
//   let filteredResults = result.map((doc) => {
//     // Parse imageDetails if it's a string, otherwise use as is
//     const imageDetails =
//       typeof doc.imageDetails === "string"
//         ? JSON.parse(doc.imageDetails)
//         : doc.imageDetails;

//     return {
//       ...doc,
//       imageDetails, // Keep the parsed version
//       // Extract commonly used fields for easier access
//       product_title:
//         imageDetails?.product_title ||
//         imageDetails?.product_details?.product_title ||
//         null,
//       product_category: imageDetails?.product_details?.category || null,
//       selected_features: imageDetails?.selected_features || [],
//       generated_skus: imageDetails?.generated_skus || null,
//       product_code: imageDetails?.product_code || null,
//       tags: imageDetails?.tags || [],
//       status: imageDetails?.status || null,
//     };
//   });

//   // Apply search filter if search term exists
//   if (search) {
//     const searchLower = search.toLowerCase();
//     filteredResults = filteredResults.filter((item) => {
//       const title = item.product_title?.toLowerCase() || "";
//       const category = item.product_category?.toLowerCase() || "";
//       const productCode = item.product_code?.toLowerCase() || "";
//       const tags =
//         item.tags?.some((tag: string) =>
//           tag.toLowerCase().includes(searchLower),
//         ) || false;

//       return (
//         title.includes(searchLower) ||
//         category.includes(searchLower) ||
//         productCode.includes(searchLower) ||
//         tags
//       );
//     });
//   }

//   // Apply pagination after filtering
//   const paginatedResults = search
//     ? filteredResults.slice(skip, skip + take)
//     : filteredResults.slice(skip, skip + take);

//   const total = search
//     ? filteredResults.length
//     : await prisma.generatedImage.count({
//         where: whereCondition,
//       });

//   const totalPages = Math.ceil(total / take);

//   return {
//     data: paginatedResults,
//     meta: {
//       page: pageNumber,
//       limit: take,
//       total: total,
//       hasNextPage: totalPages > pageNumber,
//       hasPrevPage: pageNumber > 1,
//       totalPage: totalPages,
//     },
//   };
// };

// // Recent Activity
// const getRecentActivity = async (query: any) => {
//   const { page, limit, sortBy, sortOrder, search } = query;

//   const whereCondition: Prisma.GeneratedImageWhereInput = {
//     isDeleted: false,
//   };

//   const pageNumber = parseInt(page) || 1;
//   const limitNumber = parseInt(limit) || 10;
//   const skip = (pageNumber - 1) * limitNumber;

//   const sortOption: { [key: string]: string } = {};

//   if (sortBy && sortOrder) {
//     sortOption[sortBy] = sortOrder;
//   }

//   // if (search) {
//   //   whereCondition.OR = [
//   //     { product_title: { contains: search, mode: "insensitive" } },
//   //     // { title: { contains: search, mode: "insensitive" } },
//   //     // { productType: { contains: search, mode: "insensitive" } },
//   //     // { model: { contains: search, mode: "insensitive" } },
//   //   ];
//   // }

//   // Construct a unique cache key that includes the userId, page, limit, sort, and search
//   const cacheKey = `documents:page:${pageNumber}:limit:${limitNumber}:sort:${sortBy || "createdAt"}_${sortOrder || "desc"}:search:${search || ""}`;

//   const documents = await prisma.generatedImage.findMany({
//     where: { ...whereCondition, isDeleted: false },
//     select: {
//       id: true,
//       imageDetails: true, // Keep as true since it's JSON
//       isDeleted: true,
//       createdAt: true,
//     },
//     // orderBy: sortOption,
//     orderBy: { createdAt: "desc" },
//     skip,
//     take: limitNumber,
//   });

//   const total = await prisma.generatedImage.count({
//     where: { ...whereCondition, isDeleted: false },
//   });

//   let finalResult = documents.map((document) => {
//     // Parse imageDetails if it's a string, or use as is if it's already an object
//     const imageDetails =
//       typeof document.imageDetails === "string"
//         ? JSON.parse(document.imageDetails)
//         : document.imageDetails;

//     // Extract product_title and category from the nested structure
//     const product_title =
//       imageDetails?.product_title ||
//       imageDetails?.productTitle || // Alternative field name if exists
//       null;

//     const product_category =
//       imageDetails?.product_details?.category ||
//       imageDetails?.category || // Alternative field name if exists
//       null;

//     return {
//       // ...document,
//       // imageDetails, // Include the parsed imageDetails
//       id: document.id,
//       product_title,
//       product_category,
//       isPhysical: imageDetails?.isPhysical?.length > 0 || false,
//       isAIVirtualTryOn: imageDetails?.virtual_tryon_urls?.length > 0 || false,
//       isMannequin: imageDetails?.mannequin_urls?.length > 0 || false,
//       isBackgroundRemoval:
//         imageDetails?.background_removed_url?.length > 0 || false,
//       isModel: imageDetails?.model_urls?.length > 0 || false,
//       isImageDiagram: imageDetails?.image_diagram_url?.length > 0 || false,
//       isDeleted: document.isDeleted,
//       dateFormat: formatDateAndTime(document.createdAt),
//     };
//   });

//   // await redisClient.setEx(cacheKey, 60, JSON.stringify(finalResult));

//   console.log(search);

//   if (search) {
//     const searchLower = search.toLowerCase();
//     finalResult = finalResult.filter((doc) =>
//       doc.product_title?.toLowerCase().includes(searchLower),
//     );
//   }

//   return {
//     data: finalResult,
//     meta: {
//       page: pageNumber,
//       limit: limitNumber,
//       total,
//       hasNextPage: pageNumber < Math.ceil(total / limitNumber),
//       hasPrevPage: pageNumber > 1,
//       totalPage: Math.ceil(total / limitNumber),
//     },
//   };
// };

// Recent Activity
const getRecentActivity = async (query: any) => {
  const { page, limit, sortBy, sortOrder, search } = query;

  const whereCondition: Prisma.GeneratedImageWhereInput = {
    isDeleted: false,
  };

  const pageNumber = parseInt(page) || 1;
  const limitNumber = parseInt(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const sortOption: { [key: string]: string } = {};

  if (sortBy && sortOrder) {
    sortOption[sortBy] = sortOrder;
  }

  // Construct a unique cache key that includes the userId, page, limit, sort, and search
  const cacheKey = `documents:page:${pageNumber}:limit:${limitNumber}:sort:${sortBy || "createdAt"}_${sortOrder || "desc"}:search:${search || ""}`;

  let documents;
  let total;

  if (search && search.trim() !== "") {
    // If searching, we need to fetch all documents and filter in memory
    // This is because we can't efficiently search in JSON fields with Prisma
    const allDocuments = await prisma.generatedImage.findMany({
      where: { ...whereCondition, isDeleted: false },
      select: {
        id: true,
        imageDetails: true,
        isDeleted: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Process all documents to extract searchable fields
    const processedDocs = allDocuments.map((document) => {
      try {
        const imageDetails =
          typeof document.imageDetails === "string"
            ? JSON.parse(document.imageDetails)
            : document.imageDetails || {};

        const product_title =
          imageDetails?.product_title ||
          imageDetails?.productTitle ||
          imageDetails?.listing?.title ||
          imageDetails?.product_details?.product_title ||
          null;

        return {
          ...document,
          product_title,
        };
      } catch (error) {
        return {
          ...document,
          product_title: null,
        };
      }
    });

    // Filter based on search
    const searchLower = search.toLowerCase().trim();
    const filteredDocs = processedDocs.filter((doc) => {
      const title = doc.product_title?.toLowerCase() || "";
      return title.includes(searchLower);
    });

    // Apply pagination to filtered results
    total = filteredDocs.length;
    documents = filteredDocs.slice(skip, skip + limitNumber);
  } else {
    // No search, use regular pagination
    documents = await prisma.generatedImage.findMany({
      where: { ...whereCondition, isDeleted: false },
      select: {
        id: true,
        imageDetails: true,
        isDeleted: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNumber,
    });

    total = await prisma.generatedImage.count({
      where: { ...whereCondition, isDeleted: false },
    });
  }

  // Process the final documents (either paginated from search or regular)
  let finalResult = documents.map((document: any) => {
    try {
      const imageDetails =
        typeof document.imageDetails === "string"
          ? JSON.parse(document.imageDetails)
          : document.imageDetails || {};

      const product_title =
        imageDetails?.product_title ||
        imageDetails?.productTitle ||
        imageDetails?.listing?.title ||
        imageDetails?.product_details?.product_title ||
        null;

      const product_category =
        imageDetails?.product_details?.category ||
        imageDetails?.category ||
        null;

      const isPhysical = Array.isArray(imageDetails?.isPhysical)
        ? imageDetails.isPhysical.length > 0
        : false;

      const isAIVirtualTryOn = Array.isArray(imageDetails?.virtual_tryon_urls)
        ? imageDetails.virtual_tryon_urls.length > 0
        : false;

      const isMannequin = Array.isArray(imageDetails?.mannequin_urls)
        ? imageDetails.mannequin_urls.length > 0
        : false;

      const isBackgroundRemoval = imageDetails?.background_removed_url
        ? String(imageDetails.background_removed_url).length > 0
        : false;

      const isModel = Array.isArray(imageDetails?.model_urls)
        ? imageDetails.model_urls.length > 0
        : false;

      const isImageDiagram = imageDetails?.image_diagram_url
        ? String(imageDetails.image_diagram_url).length > 0
        : false;

      return {
        id: document.id,
        product_title,
        product_category,
        isPhysical,
        isAIVirtualTryOn,
        isMannequin,
        isBackgroundRemoval,
        isModel,
        isImageDiagram,
        isDeleted: document.isDeleted,
        dateFormat: formatDateAndTime(document.createdAt),
      };
    } catch (error) {
      console.error(
        `Error parsing imageDetails for document ${document.id}:`,
        error,
      );
      return {
        id: document.id,
        product_title: null,
        product_category: null,
        isPhysical: false,
        isAIVirtualTryOn: false,
        isMannequin: false,
        isBackgroundRemoval: false,
        isModel: false,
        isImageDiagram: false,
        isDeleted: document.isDeleted,
        dateFormat: formatDateAndTime(document.createdAt),
      };
    }
  });

  const totalPages = Math.ceil(total / limitNumber);

  return {
    data: finalResult,
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total: total,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
      totalPage: totalPages,
    },
  };
};

// admin Dashboard Overview
const adminDashboardOverview = async () => {
  // Total Products: sum of totalCreatedProducts across all users
  const usersAggregate = await prisma.user.aggregate({
    _sum: { totalCreatedProducts: true },
  });
  const totalProducts = usersAggregate._sum.totalCreatedProducts ?? 0;

  // Total Generated Images
  const totalGeneratedImages = await prisma.generatedImage.count({
    where: { isDeleted: false },
  });

  // Total Generated Documents
  const totalGeneratedDocuments = await prisma.document.count({
    where: { isDeleted: false },
  });

  // Weekly chart data: count of GeneratedImage records per day for the last 7 days
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyImages = await prisma.generatedImage.findMany({
    where: {
      isDeleted: false,
      createdAt: { gte: sevenDaysAgo, lte: today },
    },
    select: { createdAt: true },
  });

  // Group by day of week
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayCounts: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    dayCounts[dayNames[d.getDay()]] = 0;
  }
  weeklyImages.forEach((img) => {
    const dayName = dayNames[img.createdAt.getDay()];
    if (dayCounts[dayName] !== undefined) {
      dayCounts[dayName]++;
    }
  });
  const weeklyDocumentsChart = Object.entries(dayCounts).map(
    ([day, count]) => ({
      day,
      count,
    }),
  );

  // Average Time Saved: average of totalSavedTimes across all users (in hours)
  const timeSavedAggregate = await prisma.user.aggregate({
    _avg: { totalSavedTimes: true },
  });

  // console.log(timeSavedAggregate);

  const averageTimeSaved = Math.round(
    (timeSavedAggregate._avg.totalSavedTimes ?? 0) / 60,
  ); // assuming totalSavedTimes is in minutes

  return {
    totalProducts,
    totalGeneratedImages,
    totalGeneratedDocuments,
    weeklyDocumentsChart,
    averageTimeSaved,
  };
};

export const AdminServices = {
  getAllAdmin,
  getSingleAdmin,
  removeAdmin,
  addSocialMedia,
  updateSocialMedia,
  getSocialMedia,
  getRecentActivity,
  adminDashboardOverview,
};

/*
I need data like given image.
Code path is:
"/src/app/modules/admin/admin.service.ts" adminDashboardOverview function.

Code line is:
1101-1124
*/
