import multer from "multer";
import path from "path";
// Multer storage configuration
const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "public", "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "public", "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}`;
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

const uploadVehicleDoc = upload.fields([
  { name: "insuranceCard", maxCount: 1 },
  { name: "vehicleImage", maxCount: 1 },
]);

const refereeImageOrCertificate = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "certificate", maxCount: 1 },
]);

const adminProfileImage = upload.single("image");

const addMatchTwoTeamsLogo = upload.fields([
  { name: "team1Logo", maxCount: 1 },
  { name: "team2Logo", maxCount: 1 },
]);

const leagueOfficialsImageOrOfficialsImage = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "officialImage", maxCount: 1 },
]);
const messageFiles = upload.fields([{ name: "files", maxCount: 6 }]);

const sendMsg = upload.single("fileImage");
const profileImage = upload.single("profileImage");
const uploadImage = upload.single("image");
const uploadCategoryIcon = upload.single("categoryIcon");
const uploadProductImage = upload.array("productImage", 5);
// const documentImages = upload.array("images", 100);
const documentImages = upload.fields([
  { name: "images", maxCount: 100 },
  { name: "backpart_images", maxCount: 100 },
]);
// const driveImage = upload.single("driveImage");

const memoryStorage = multer.memoryStorage();

const driveImage = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit (adjust as needed)
}).single("driveImage");

const csvFile = upload.single("csvFile");

// Export file uploader methods
export const fileUploader = {
  upload,
  uploadImage,
  profileImage,
  uploadVehicleDoc,
  uploadCategoryIcon,
  uploadProductImage,
  sendMsg,
  refereeImageOrCertificate,
  leagueOfficialsImageOrOfficialsImage,
  addMatchTwoTeamsLogo,
  messageFiles,
  adminProfileImage,
  documentImages,
  driveImage,
  csvFile,
};
