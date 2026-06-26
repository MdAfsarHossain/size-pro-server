import httpStatus from "http-status";
import { S3Uploader } from "../lib/S3Uploader";
import ApiError from "../errors/ApiError";

// Helper function for file upload
export const uploadFileToS3 = async (file: any, path: string, fileType: string): Promise<string | null> => {
    if (!file) return null;

    try {
        const uploadResult = await S3Uploader.uploadToS3(file, path);
        // deleteImage(file?.path); // Uncomment if you need to delete local file
        return uploadResult.Location;
    } catch (error) {
        console.error(`Error uploading ${fileType}:`, error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload ${fileType}`);
    }
}
