import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
// console.log("Cloudinary key:", process.env.CLOUDINARY_API_KEY);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file buffer to Cloudinary
 * @param {Object} file - multer file object
 * @param {String} folder - cloudinary folder name
 */
const uploadToCloudinary = async (file, folder = "roles") => {
  if (!file) return null;

  return await cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
    {
      folder,
      resource_type: "auto",
    },
  );
};

/**
 * Delete file from Cloudinary using public_id
 * @param {String} publicId
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId);
};

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fieldSize: 1024 * 1024 * 10, // size of the file 10mb
  },
});

export { cloudinary, upload, uploadToCloudinary, deleteFromCloudinary };
