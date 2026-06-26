import prisma from "../../lib/prisma";
import { ProductType, ModelType, Prisma } from "@prisma/client";
import { formatDateAndTime } from "../../utils/formatDate";
import axios from "axios";
import config from "../../../config";
import fs from "fs";
import { createRedisClient } from "../../../config/redis";
import { google } from "googleapis";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
// import { GoogleAuth } from "google-auth-library";

interface DocumentData {
  // userId: string;
  title: string;
  productType: ProductType;
  model: ModelType[];
  // aiGenerated: JSON;
  // mannequin?: string;
  // image?: string;
  // dimensions?: string;
  // aiVirtual?: string;
  // backgroundRemoval?: string;
  // imageDiagram?: string;
}


// Create Document
const createDocument = async (
  userId: string,
  documentData: any,
  files: any,
) => {
  const language = documentData.language;
  const features = documentData.features;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const fullName = `${user.firstName} ${user.lastName}`;
  let products = 0;

  const formData = new FormData();
  // formData.append("features_json", JSON.stringify(documentData)); // It's work
  formData.append("features_json", JSON.stringify(features));
  formData.append("seller_id", userId);
  formData.append("seller_name", fullName);
  formData.append("language", language);
  files.images.forEach((file: any) => {
    products++;
    const fileBuffer = fs.readFileSync(file.path);
    const blob = new Blob([fileBuffer], { type: file.mimetype });
    formData.append("images", blob, file.originalname);
  });

  // Backparts Image 
   files.backpart_images.forEach((file: any) => {
    // products++;
    const fileBuffer = fs.readFileSync(file.path);
    const blob = new Blob([fileBuffer], { type: file.mimetype });
    formData.append("backpart_images", blob, file.originalname);
  });

  const generatedImages = features.reduce(
    (sum: any, item: any) => sum + item.features.length,
    0,
  );

  let totalSavedTimes = features.reduce(
    (sum: any, item: any) => sum + item.features.length,
    0,
  );

  totalSavedTimes = totalSavedTimes * 15;
  let response;

  try {
    response = await axios.post(`${process.env.AI_API}/generate`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 100000000, // 1000 seconds
    });
  } catch (error: any) {
    console.log(`AI Post Error.`);
    console.log(error);
    throw new ApiError(httpStatus.BAD_REQUEST, "AI Post Error.");
  }

  // console.log("response.data", response?.data);

  const document = await prisma.document.create({
    data: {
      userId,
      aiGenerated: response?.data,
    },
  });

  let generatedImageId: string[] = [];

  const result = await Promise.all(
    response?.data?.product.images_batch.map(async (item: any) => {
      // generatedImages++;
      const image = await prisma.generatedImage.create({
        data: {
          userId,
          imageDetails: item,
        },
      });
      // console.log(image);
      // console.log(image.id);

      generatedImageId.push(image.id);
    }),
  );

  // response?.data.product?.images_batch.forEach((item: any) => {
  //   generatedImages++;
  // });

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      totalCreatedProducts: {
        increment: products,
      },
      totalGeneratedProducts: {
        increment: generatedImages,
      },
      totalSavedTimes: {
        increment: totalSavedTimes,
      },
    },
  });

  return { document, generatedImageId };
};

// My All Documents
// const myAllDocuments = async (userId: string, query: any) => {
//   const { page, limit, sortBy, sortOrder, search } = query;

//   const whereCondition: Prisma.GeneratedImageWhereInput = {
//     userId,
//     isDeleted: false,
//   };

//   const pageNumber = parseInt(page) || 1;
//   const limitNumber = parseInt(limit) || 10;
//   const skip = (pageNumber - 1) * limitNumber;

//   const sortOption: { [key: string]: string } = {};

//   if (sortBy && sortOrder) {
//     sortOption[sortBy] = sortOrder;
//   }

//   if (search) {
//     whereCondition.OR = [
//       {
//         "imageDetails.title": {
//           contains: search,
//           mode: "insensitive",
//         },
//       },
//       {
//         "imageDetails.product_details.productType": {
//           contains: search,
//           mode: "insensitive",
//         },
//       },
//       {
//         "imageDetails.product_details.model": {
//           contains: search,
//           mode: "insensitive",
//         },
//       },
//     ];
//   }
//   /*
//   // Construct a unique cache key that includes the userId, page, limit, sort, and search
//   const cacheKey = `documents:${userId}:page:${pageNumber}:limit:${limitNumber}:sort:${sortBy || "createdAt"}_${sortOrder || "desc"}:search:${search || ""}`;

//   // try {
//   // Get the actual Redis client instance
//   const redisClient = await createRedisClient();
//   // Check Redis cache first
//   const cachedData = await redisClient.get(cacheKey);

//   if (cachedData) {
//     console.log(`✅ Cache hit for ${cacheKey}`);
//     const parsedData = JSON.parse(cachedData);
//     // console.log(parsedData);

//     const total = await prisma.generatedImage.count({
//       where: { ...whereCondition, isDeleted: false },
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

//   */
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

//   const finalResult = documents.map((document) => {
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
//   // } catch (error) {
//   //   console.log("❌ Failed to set cache for documents");
//   // }
// };

const myAllDocuments = async (userId: string, query: any) => {
  const { page, limit, sortBy, sortOrder, search } = query;

  const pageNumber = parseInt(page) || 1;
  const limitNumber = parseInt(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  let documents: any[] = [];
  let total = 0;

  if (search) {
    const searchRegex = { $regex: search, $options: "i" };
    // Mongoose/MongoDB raw query filter for JSON fields
    const rawMatch = {
      userId: { $oid: userId },
      isDeleted: false,
      $or: [
        { "imageDetails.product_title": searchRegex },
      ],
    };

    const rawDocs: any = await prisma.generatedImage.findRaw({
      filter: rawMatch,
      options: {
        skip,
        limit: limitNumber,
        sort: { createdAt: -1 },
        projection: { _id: 1, imageDetails: 1, isDeleted: 1, createdAt: 1 },
      },
    });

    // Map raw MongoDB objects to Prisma format
    documents = rawDocs.map((doc: any) => ({
      id: doc._id.$oid,
      imageDetails: doc.imageDetails,
      isDeleted: doc.isDeleted,
      createdAt: doc.createdAt?.$date
        ? new Date(doc.createdAt.$date)
        : new Date(),
    }));

    const countDocs: any = await prisma.generatedImage.aggregateRaw({
      pipeline: [{ $match: rawMatch }, { $count: "total" }],
    });

    total = countDocs.length > 0 ? countDocs[0].total : 0;
  } else {
    const whereCondition: Prisma.GeneratedImageWhereInput = {
      userId,
      isDeleted: false,
    };

    const sortOption: { [key: string]: string } = {};
    if (sortBy && sortOrder) {
      sortOption[sortBy] = sortOrder;
    }

    documents = await prisma.generatedImage.findMany({
      where: whereCondition,
      select: {
        id: true,
        imageDetails: true, // Keep as true since it's JSON
        isDeleted: true,
        createdAt: true,
        //#
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      // orderBy: sortOption,
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNumber,
    });

    total = await prisma.generatedImage.count({
      where: whereCondition,
    });
  }

  const finalResult = documents.map((document) => {
    //#
    const sellerName = `${document.user.firstName} ${document.user.lastName}`;

    
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
      // ...document,
      // imageDetails, // Include the parsed imageDetails
      id: document.id,
      sellerName, //#
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

  // await redisClient.setEx(cacheKey, 60, JSON.stringify(finalResult));

  return {
    data: finalResult,
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      hasNextPage: pageNumber < Math.ceil(total / limitNumber),
      hasPrevPage: pageNumber > 1,
      totalPage: Math.ceil(total / limitNumber),
    },
  };
  // } catch (error) {
  //   console.log("❌ Failed to set cache for documents");
  // }
};

// Get Document
// const getDocument = async (documentId: string) => {
//   const cacheKey = `document:${documentId}`;

//   // Get the actual Redis client instance
//   const redisClient = await createRedisClient();

//   // Check cache first
//   const cachedData = await redisClient.get(cacheKey);
//   if (cachedData) {
//     console.log(`✅ Cache hit for ${cacheKey}`);
//     return JSON.parse(cachedData);
//   }

//   console.log(`❌ Cache miss for ${cacheKey}`);

//   const document = await prisma.document.findUnique({
//     where: { id: documentId },
//   });

//   // If the document is found, save it in Redis cache for 60 seconds
//   if (document) {
//     await redisClient.setEx(cacheKey, 60, JSON.stringify(document));
//   }

//   return document;
// };

const getDocument = async (documentId: string) => {
  const document = await prisma.generatedImage.findUnique({
    where: { id: documentId },
    //#
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!document || document.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, "Document not found");
  }

  return document;
};

// Update Document
const updateDocument = async (documentId: string, documentData: any) => {
  const existingDocument = await prisma.generatedImage.findUnique({
    where: { id: documentId },
  });

  if (!existingDocument) {
    throw new ApiError(httpStatus.NOT_FOUND, "Document not found");
  }

  const updatePayload: Record<string, any> = {};

  if (documentData.imageDetails !== undefined) {
    updatePayload.imageDetails = documentData.imageDetails;
  }

  if (documentData.isDeleted !== undefined) {
    updatePayload.isDeleted = documentData.isDeleted;
  }

  const document = await prisma.generatedImage.update({
    where: { id: documentId },
    data: updatePayload,
  });

  // Delete cache
  // const redisClient = await createRedisClient();
  // await redisClient.del(`document:${documentId}`);
  // await redisClient.del(`documents:${existingDocument.userId}`);
  // const cacheKey = `documents:${documentId}`;
  // Set new cache
  // await redisClient.setEx(cacheKey, 60, JSON.stringify(document));

  return document;
};

// Delete Document
const deleteDocument = async (userId: string, documentId: string) => {
  const document = await prisma.generatedImage.findUnique({
    where: { id: documentId, userId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.userId !== userId) {
    throw new Error("You are not authorized to delete this document");
  }

  const deletedDocument = await prisma.generatedImage.update({
    where: { id: documentId, userId },
    data: {
      isDeleted: true,
    },
  });
  return deletedDocument;
};

// // Save to drive
// const saveToDrive = async (userId: string, documentId: string) => {
//   // --- 1. Fetch the document from DB ---
//   const document = await prisma.generatedImage.findUnique({
//     // where: { id: documentId, userId },
//     where: { id: documentId },
//   });

//   if (!document) {
//     throw new Error("Document not found");
//   }

//   console.log("document", document);

//   // if (document.userId !== userId) {
//   //   throw new Error("You are not authorized to save this document");
//   // }

//   // --- 2. Authenticate with Google Drive via Service Account ---
//   const auth = new google.auth.GoogleAuth({
//     credentials: {
//       client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
//       private_key: (process.env.GOOGLE_DRIVE_PRIVATE_KEY || "").replace(
//         /\\n/g,
//         "\n",
//       ),
//     },
//     scopes: ["https://www.googleapis.com/auth/drive"],
//   });

//   const drive = google.drive({ version: "v3", auth });

//   // --- 3. Create or find a folder for this document in Drive ---
//   const folderName = `Document_${documentId}`;
//   const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID; // root folder in Drive

//   const folderRes = await drive.files.create({
//     requestBody: {
//       name: folderName,
//       mimeType: "application/vnd.google-apps.folder",
//       parents: parentFolderId ? [parentFolderId] : undefined,
//     },
//     fields: "id, webViewLink",
//     supportsAllDrives: true,
//   });

//   const folderId = folderRes.data.id!;
//   const folderLink = folderRes.data.webViewLink!;

//   // Make the folder publicly readable
//   await drive.permissions.create({
//     fileId: folderId,
//     requestBody: {
//       role: "reader",
//       type: "anyone",
//     },
//     supportsAllDrives: true,
//   });

//   // --- 4. Collect all image URLs from imageDetails ---
//   const imageDetails =
//     typeof document.imageDetails === "string"
//       ? JSON.parse(document.imageDetails as string)
//       : (document.imageDetails as Record<string, any>);

//   const urlGroups: { label: string; urls: string[] }[] = [
//     { label: "physical", urls: imageDetails?.isPhysical || [] },
//     { label: "virtual_tryon", urls: imageDetails?.virtual_tryon_urls || [] },
//     { label: "mannequin", urls: imageDetails?.mannequin_urls || [] },
//     {
//       label: "background_removed",
//       urls: imageDetails?.background_removed_url
//         ? [imageDetails.background_removed_url]
//         : [],
//     },
//     { label: "model", urls: imageDetails?.model_urls || [] },
//     {
//       label: "image_diagram",
//       urls: imageDetails?.image_diagram_url
//         ? [imageDetails.image_diagram_url]
//         : [],
//     },
//   ];

//   // --- 5. Upload each image to the Drive folder ---
//   const uploadedFiles: { name: string; fileId: string; webViewLink: string }[] =
//     [];

//   for (const group of urlGroups) {
//     for (let i = 0; i < group.urls.length; i++) {
//       const imageUrl = group.urls[i];
//       if (!imageUrl) continue;

//       try {
//         // Download the image as a stream
//         const imageResponse = await axios.get(imageUrl, {
//           responseType: "stream",
//         });

//         const contentType =
//           imageResponse.headers["content-type"] || "image/jpeg";
//         const ext = contentType.split("/")[1]?.split(";")[0] || "jpg";
//         const fileName = `${group.label}_${i + 1}.${ext}`;

//         // Upload stream directly to Google Drive
//         const uploadRes = await drive.files.create({
//           requestBody: {
//             name: fileName,
//             parents: [folderId],
//           },
//           media: {
//             mimeType: contentType,
//             body: imageResponse.data,
//           },
//           fields: "id, webViewLink",
//           supportsAllDrives: true,
//         });

//         uploadedFiles.push({
//           name: fileName,
//           fileId: uploadRes.data.id!,
//           webViewLink: uploadRes.data.webViewLink!,
//         });
//       } catch (err) {
//         console.error(
//           `Failed to upload image ${imageUrl} to Drive:`,
//           (err as Error).message,
//         );
//       }
//     }
//   }

//   // // Upload stream directly to Google Drive
//   // const uploadRes = await drive.files.create({
//   //   requestBody: {
//   //     name: file.originalname,
//   //     parents: [folderId],
//   //   },
//   //   media: {
//   //     mimeType: file.mimetype,
//   //     body: file.buffer,
//   //   },
//   //   fields: "id, webViewLink",
//   // });

//   return {
//     message: "Files saved to Google Drive successfully",
//     folderLink,
//     folderId,
//     // driveFileId: uploadRes.data.id!,
//     // driveFileLink: uploadRes.data.webViewLink!,
//     // uploadRes,
//     uploadedFiles,
//   };
// };

// Save to drive
// const saveToDrive = async (userId: string, documentId: string, file: any) => {
//   console.log(file);

//   // --- 1. Fetch the document from DB ---
//   const document = await prisma.generatedImage.findUnique({
//     where: { id: documentId },
//   });

//   if (!document) {
//     throw new Error("Document not found");
//   }

//   // --- 2. Authenticate with Google Drive via OAuth2 ---
//   // OAuth2 uses the real Google account's storage quota (unlike Service Accounts which have 0 quota)
//   const oauth2Client = new google.auth.OAuth2(
//     process.env.GOOGLE_DRIVE_CLIENT_ID,
//     process.env.GOOGLE_DRIVE_CLIENT_SECRET,
//     "urn:ietf:wg:oauth:2.0:oob", // Redirect URI for non-web apps
//   );

//   oauth2Client.setCredentials({
//     refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
//   });

//   const drive = google.drive({ version: "v3", auth: oauth2Client });

//   // --- 3. Create a folder for this document in Drive ---
//   const folderName = `Document_${documentId}`;
//   const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

//   const folderRes = await drive.files.create({
//     requestBody: {
//       name: folderName,
//       mimeType: "application/vnd.google-apps.folder",
//       parents: parentFolderId ? [parentFolderId] : undefined,
//     },
//     fields: "id, webViewLink",
//   });

//   const folderId = folderRes.data.id!;
//   const folderLink = folderRes.data.webViewLink!;

//   // Make the folder publicly readable (so anyone with the link can view)
//   await drive.permissions.create({
//     fileId: folderId,
//     requestBody: {
//       role: "reader",
//       type: "anyone",
//     },
//   });

//   // --- 4. Generate CSV and upload to the Drive folder ---
//   // const csvString = await generateCSV(documentId);

//   const uploadRes = await drive.files.create({
//     requestBody: {
//       name: `document_${documentId}.csv`,
//       parents: [folderId],
//     },
//     media: {
//       mimeType: "text/csv",
//       body: file,
//     },
//     fields: "id, webViewLink",
//   });

//   return {
//     message: "CSV file saved to Google Drive successfully",
//     folderLink,
//     folderId,
//     driveFileId: uploadRes.data.id!,
//     driveFileLink: uploadRes.data.webViewLink!,
//   };
// };

// import { GoogleAuth } from "google-auth-library";

// const saveToDrive = async (userId: string, documentId: string, file: any) => {
//   try {
//     // --- 1. Fetch the document from DB ---
//     const document = await prisma.generatedImage.findUnique({
//       where: { id: documentId },
//     });

//     if (!document) {
//       throw new Error("Document not found");
//     }

//     // --- 2. Authenticate with Google Drive using Service Account ---
//     let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
//     if (privateKey) {
//       privateKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
//     }

//     const auth = new GoogleAuth({
//       credentials: {
//         client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
//         private_key: privateKey,
//       },
//       scopes: ["https://www.googleapis.com/auth/drive"],
//     });

//     const drive = google.drive({ version: "v3", auth });

//     // --- 3. Create a folder for this document in Drive ---
//     const folderName = `Document_${documentId}`;
//     const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

//     const folderRes = await drive.files.create({
//       requestBody: {
//         name: folderName,
//         mimeType: "application/vnd.google-apps.folder",
//         parents: parentFolderId ? [parentFolderId] : undefined,
//       },
//       fields: "id, webViewLink",
//     });

//     const folderId = folderRes.data.id!;
//     const folderLink = folderRes.data.webViewLink!;

//     // Make the folder publicly readable
//     await drive.permissions.create({
//       fileId: folderId,
//       requestBody: {
//         role: "reader",
//         type: "anyone",
//       },
//     });

//     // --- 4. Upload the file to the Drive folder ---
//     const uploadRes = await drive.files.create({
//       requestBody: {
//         name: file.originalname,
//         parents: [folderId],
//       },
//       media: {
//         mimeType: file.mimetype,
//         body: fs.createReadStream(file.path),
//       },
//       fields: "id, webViewLink",
//     });

//     // Make the CSV file publicly readable
//     await drive.permissions.create({
//       fileId: uploadRes.data.id!,
//       requestBody: {
//         role: "reader",
//         type: "anyone",
//       },
//     });

//     return {
//       message: "CSV file saved to Google Drive successfully",
//       folderLink,
//       folderId,
//       driveFileId: uploadRes.data.id!,
//       driveFileLink: uploadRes.data.webViewLink!,
//     };
//   } catch (error: any) {
//     console.error("Error in saveToDrive:", error);
//     throw new Error(`Failed to save to Drive: ${error.message}`);
//   }
// };

const saveToDrive = async (userId: string, documentId: string, file?: any) => {
  try {
    // --- 1. Fetch the document from DB ---
    const document = await prisma.generatedImage.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // --- 2. Authenticate with Google Drive using Service Account (lazy.json) ---
    // const auth = new GoogleAuth({
    //   keyFile: require("path").resolve(process.cwd(), "lazy.json"),
    //   scopes: ["https://www.googleapis.com/auth/drive"],
    // });

    // const auth = new GoogleAuth({
    //   credentials: {
    //     client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    //     private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY,
    //   },
    //   scopes: ["https://www.googleapis.com/auth/drive"],
    // });

    // const auth = new GoogleAuth({
    //   keyFilename: path.join(__dirname, "../../../../lazy.json"),
    //   scopes: ["https://www.googleapis.com/auth/drive"],
    // });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY,
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    // --- 3. Create a folder for this document in Drive ---
    const folderName = `Document_${documentId}`;
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const folderRes = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentFolderId ? [parentFolderId] : undefined,
      },
      fields: "id, webViewLink",
    });

    const folderId = folderRes.data.id!;
    const folderLink = folderRes.data.webViewLink!;

    // Make the folder publicly readable
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // // --- 4. Generate CSV string from document data ---
    // const csvString = await generateCSV(documentId);

    // // Convert the CSV string to a readable stream (required by Drive API)
    // const { Readable } = require("stream");
    // const csvStream = Readable.from([csvString]);

    // console.log(csvString);
    // console.log(csvStream);

    // // --- 5. Upload the CSV file to the Drive folder ---
    // const csvFileName = `document_${documentId}.csv`;

    const uploadRes = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [folderId],
      },
      media: {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
      },
      fields: "id, webViewLink",
    });

    // Make the uploaded CSV file publicly readable
    await drive.permissions.create({
      fileId: uploadRes.data.id!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return {
      message: "File saved to Google Drive successfully",
      folderLink,
      folderId,
      driveFileId: uploadRes.data.id!,
      driveFileLink: uploadRes.data.webViewLink!,
    };
  } catch (error: any) {
    console.error("Error in saveToDrive:", error);
    throw new Error(`Failed to save to Drive: ${error.message}`);
  }
};

// Generate data into CSV file
const generateCSV = async (documentId: string) => {
  const document = await prisma.generatedImage.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // console.log("document", document);
  /*
  document {
  id: '69c9efe93ce3428f5fdae015',
  userId: '69c64c7733d99e261fdb66e8',
  imageDetails: {
    image_index: 0,
    selected_features: [
      'physical_dimensions',
      'background_removal',
      'ai_virtual_tryon',
      'model',
      'image_diagram',
      'mannequin'
    ],
    generated_skus: {
      physical_dimensions: 'SKU-00089C125E85_1',
      background_removal: 'SKU-00089C125E85_2',
      ai_virtual_tryon: 'SKU-00089C125E85_3',
      model: 'SKU-00089C125E85_4',
      image_diagram: 'SKU-00089C125E85_5',
      mannequin: 'SKU-00089C125E85_6'
    },
    original_url: 'https://s3.eu-north-1.amazonaws.com/aj-propl/originals/2026/03/30/025c22f4bfd74ec387d1942f43caa90e.jpg',
    background_removed_url: 'https://s3.eu-north-1.amazonaws.com/aj-propl/bg_removed/2026/03/30/355b3936920f45f0b63a7a22ae6bbf1b.png',
    care_instructions: 'Hand wash separately in cold water. Use mild detergent. Dry in shade. Do not bleach.',
    description: "Embrace elegance with this stunning sea green saree, crafted from lightweight, breathable cotton. Featuring intricate white floral motifs and charming multi-colored tassels on the pallu, it's perfect for casual outings or festive celebrations. The delicate self-print adds a layer of sophisticated detail to this timeless ethnic wear staple.",
    dimensions: {
      chest_width_in: null,
      waist_width_in: null,
      back_length_in: null,
      sleeve_length_in: null,
      under_bust_in: null,
      dress_length_in: 220,
      available_sizes: [Array],
      size_guide: 'Free size. This is a standard saree, typically measuring approximately 5.5 to 6 meters in length.',
      has_ruler_reference: false,
      confidence: 'medium'
    },
    fabric: 'Cotton Blend',
    image_diagram_url: 'https://s3.eu-north-1.amazonaws.com/aj-propl/diagrams/2026/03/30/980fec1836fd4df8be7a1f969229a6d9.jpg',
    key_features: [
      'Breathable cotton fabric',
      'Vibrant floral motifs',
      'Elegant tassel detailing'
    ],
    listing: {
      title: "Women's Sea Green Floral Cotton Saree with Tassels",
      description: "Embrace elegance with this stunning sea green saree, crafted from lightweight, breathable cotton. Featuring intricate white floral motifs and charming multi-colored tassels on the pallu, it's perfect for casual outings or festive celebrations. The delicate self-print adds a layer of sophisticated detail to this timeless ethnic wear staple.",
      tags: [Array],
      fabric: 'Cotton Blend'
    },
    mannequin_urls: [
      'https://s3.eu-north-1.amazonaws.com/aj-propl/mannequins/2026/03/30/a0e9e8b0bca74b24a81ae4b3ea9d3d32.png'
    ],
    model_urls: [
      'https://s3.eu-north-1.amazonaws.com/aj-propl/models/2026/03/30/7600e46cbe9e4577a6be707f0ba57545.png'
    ],
    product_code: 'SR-GN-FL-01',
    product_details: {
      category: 'Women > Ethnic Wear',
      brand: 'Artisanal Collection',
      sleeve_length: 'N/A',
      dress_type: 'Saree',
      age_group: '18-65',
      gender: 'Female'
    },
    product_title: "Women's Sea Green Floral Cotton Saree with Tassels",
    seo_tags: [
      'green cotton saree',
      'floral print saree',
      "women's ethnic wear",
      'casual saree',
      'handcrafted saree'
    ],
    status: 'completed',
    tags: [
      'saree',
      'ethnic wear',
      'cotton',
      'floral print',
      'traditional',
      'indian wear',
      'teal'
    ],
    updated_at: '2026-03-30T03:36:19.682000',
    variant_data: {
      sizes: [Array],
      colors: [Array],
      condition: 'New',
      feature: 'Hand-printed floral pattern'
    },
    virtual_tryon_urls: [
      'https://s3.eu-north-1.amazonaws.com/aj-propl/tryons/2026/03/30/85296c3346794761bb27e0d3bfd1f5b8.png'
    ]
  },
  isDeleted: false,
  createdAt: 2026-03-30T03:37:13.754Z,
  updatedAt: 2026-03-30T03:37:13.754Z
}
  */

  const imageDetails =
    typeof document.imageDetails === "string"
      ? JSON.parse(document.imageDetails as string)
      : (document.imageDetails as Record<string, any>);

  // Helper function to flatten nested objects and arrays
  const flattenObject = (obj: any, prefix = ""): Record<string, any> => {
    return Object.keys(obj).reduce((acc: any, k: string) => {
      const pre = prefix.length ? prefix + "." : "";
      if (
        typeof obj[k] === "object" &&
        obj[k] !== null &&
        !Array.isArray(obj[k])
      ) {
        Object.assign(acc, flattenObject(obj[k], pre + k));
      } else if (Array.isArray(obj[k])) {
        acc[pre + k] = obj[k].join(" | ");
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {});
  };

  const flattenedData = flattenObject(imageDetails);

  // Helper to escape CSV strings
  const escapeCSV = (value: any) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    // If the string contains a comma, newline, or double quote, we must wrap it in quotes
    // and escape any existing double quotes with a double-double quote
    if (/[,"\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const csvRows = [
    ["Property", "Value"],
    ...Object.entries(flattenedData).map(([key, value]) => [
      escapeCSV(key),
      escapeCSV(value),
    ]),
  ];

  const csvString = csvRows.map((row) => row.join(",")).join("\n");

  return csvString;
};

// A Function that can provide access to google drive api
// async function authorize() {
//   const jwtClient = new google.auth.GoogleAuth({
//     credentials: {
//       client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
//       private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY,
//     },
//     scopes: ["https://www.googleapis.com/auth/drive"],
//   });
//   await jwtClient.getClient();
//   return jwtClient;
// }

// // A Function that will upload the desired file to google drive folder
// async function uploadFile(authClient: any) {
//   return new Promise((resolve, rejected) => {
//     const drive = google.drive({ version: "v3", auth: authClient });
//     var fileMetaData = {
//       name: "mydrivetext.txt",
//       parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // A folder ID to which file will get uploaded
//     };

//     drive.files.create(
//       {
//         resource: fileMetaData,
//         media: {
//           body: fs.createReadStream("mydrivetext.txt"), // files that will get uploaded
//           mimeType: "text/plain",
//         },
//         fields: "id",
//       },
//       function (error: any, file: any) {
//         if (error) {
//           return rejected(error);
//         }
//         resolve(file);
//       },
//     );
//   });
// }

// authorize().then(uploadFile).catch("error", console.error); // function call

export const DocumentServices = {
  createDocument,
  myAllDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  // saveToDrive,
  generateCSV,
};
