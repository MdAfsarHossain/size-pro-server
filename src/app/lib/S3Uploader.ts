import fs from "fs/promises";
import {
  AbortMultipartUploadCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import config from "../../config";
import { s3Client } from "./S3Client";
import { removeFile } from "../utils/removeFile";

// **Multipart Upload to DigitalOcean Spaces**
const uploadToS3 = async (
  file: Express.Multer.File,
  folder?: string,
): Promise<{ Location: string; Bucket: string; Key: string }> => {
  if (!file) {
    throw new Error("File is required for uploading.");
  }
  if (!file.path || !file.mimetype || !file.originalname) {
    throw new Error("Invalid file data provided.");
  }

  // console.log(file);
  // size-pro-uploads-prod
  // size-pro-images/
  const Bucket = config.S3.bucketName || "";
  const Key = folder
    ? `ajpropl-images/${folder}/${file.originalname}`
    : `ajpropl-images/${file.originalname}`;

  try {
    const fileBuffer = await fs.readFile(file.path);
    const command = new PutObjectCommand({
      Bucket: config.S3.bucketName,
      Key,
      Body: fileBuffer,
      // ACL: "public-read",
      ContentType: file.mimetype,
    });

    const uploadResult = await s3Client.send(command);

    if (!uploadResult) {
      throw new Error("Failed to initiate multipart upload.");
    }
    // Remove local file after successful upload
    await removeFile(file.path);

    // Correct URL generation based on your S3 provider
    let locationUrl: string;

    if (config.S3.endpoint.includes("digitaloceanspaces.com")) {
      // DigitalOcean Spaces URL format
      locationUrl = `${config.S3.endpoint}/${Bucket}/${Key}`;
    } else {
      // AWS S3 URL format (virtual hosted style)
      locationUrl = `https://${Bucket}.s3.${config.S3.region}.amazonaws.com/${Key}`;
    }

    return {
      Location: locationUrl,
      Bucket,
      Key,
    };
  } catch (error) {
    console.error("Error in S3 upload:", error);

    // Clean up local file on error too
    try {
      await removeFile(file.path);
    } catch (cleanupError) {
      console.error("Error cleaning up file:", cleanupError);
    }

    throw error;
  }
};

// **Abort Multipart Upload (Optional)**
const abortMultipartUpload = async (
  Bucket: string,
  Key: string,
  UploadId: string,
) => {
  try {
    const abortCommand = new AbortMultipartUploadCommand({
      Bucket,
      Key,
      UploadId,
    });
    await s3Client.send(abortCommand);
  } catch (error) {
    console.error("Error aborting multipart upload:", error);
  }
};

// **Upload Buffer to S3**
const uploadBufferToS3 = async (
  buffer: Buffer,
  originalname: string,
  mimetype: string,
  folder?: string,
): Promise<{ Location: string; Bucket: string; Key: string }> => {
  const Bucket = config.S3.bucketName || "";
  const Key = folder
    ? `ajpropl-images/${folder}/${originalname}`
    : `ajpropl-images/${originalname}`;

  try {
    const command = new PutObjectCommand({
      Bucket: config.S3.bucketName,
      Key,
      Body: buffer,
      ContentType: mimetype,
    });

    const uploadResult = await s3Client.send(command);

    if (!uploadResult) {
      throw new Error("Failed to upload buffer.");
    }

    let locationUrl: string;

    if (config.S3.endpoint.includes("digitaloceanspaces.com")) {
      locationUrl = `${config.S3.endpoint}/${Bucket}/${Key}`;
    } else {
      locationUrl = `https://${Bucket}.s3.${config.S3.region}.amazonaws.com/${Key}`;
    }

    return {
      Location: locationUrl,
      Bucket,
      Key,
    };
  } catch (error) {
    console.error("Error in S3 buffer upload:", error);
    throw error;
  }
};

// Export file uploader methods
export const S3Uploader = {
  abortMultipartUpload,
  uploadToS3,
  uploadBufferToS3,
};
