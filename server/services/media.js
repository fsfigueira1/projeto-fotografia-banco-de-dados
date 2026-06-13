const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const { v2: cloudinaryClient } = require("cloudinary");

const { getEnv } = require("../config/env");

function createMediaService({
  env = getEnv(),
  cloudinary = cloudinaryClient,
  fileSystem = fs,
  uploadsDirectory = path.join(process.cwd(), "uploads")
} = {}) {
  if (env.MEDIA_STORAGE === "cloudinary") {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }

  async function uploadCloudinaryImage({ buffer, galleryId }) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          type: "authenticated",
          folder: `photography/galleries/${galleryId}`,
          overwrite: false,
          unique_filename: true
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }
      );
      stream.end(buffer);
    });

    return {
      storageProvider: "cloudinary",
      providerAssetId: result.public_id,
      sourceUrl: result.secure_url,
      url: result.secure_url,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      format: result.format
    };
  }

  async function uploadLocalImage({ buffer, filename }) {
    await fileSystem.mkdir(uploadsDirectory, { recursive: true });
    const extension = path.extname(filename || "").toLowerCase() || ".jpg";
    const safeExtension = extension.replace(/[^a-z0-9.]/g, "") || ".jpg";
    const storedName = `${randomUUID()}${safeExtension}`;
    const filePath = path.join(uploadsDirectory, storedName);
    await fileSystem.writeFile(filePath, buffer);

    return {
      storageProvider: "local",
      providerAssetId: storedName,
      sourceUrl: `/uploads/${storedName}`,
      url: `/uploads/${storedName}`,
      bytes: buffer.length
    };
  }

  function uploadImage(input) {
    return env.MEDIA_STORAGE === "cloudinary"
      ? uploadCloudinaryImage(input)
      : uploadLocalImage(input);
  }

  function getPreviewUrl(photo) {
    if (photo.storageProvider !== "cloudinary") {
      return photo.sourceUrl || photo.url;
    }

    return cloudinary.url(photo.providerAssetId, {
      secure: true,
      type: "authenticated",
      sign_url: true,
      transformation: [
        {
          width: 1600,
          height: 1600,
          crop: "limit",
          quality: "auto:eco",
          fetch_format: "auto"
        },
        {
          overlay: {
            font_family: "Arial",
            font_size: 54,
            font_weight: "bold",
            text: "PROVA"
          },
          color: "#FFF4CC",
          opacity: 42,
          gravity: "center"
        }
      ]
    });
  }

  function getDownloadUrl(photo) {
    if (photo.storageProvider !== "cloudinary") {
      return photo.sourceUrl || photo.url;
    }

    return cloudinary.url(photo.providerAssetId, {
      secure: true,
      type: "authenticated",
      sign_url: true,
      flags: "attachment",
      quality: "auto:best",
      fetch_format: "auto"
    });
  }

  function getLocalFilePath(photo) {
    if (photo.storageProvider !== "local") return null;
    return path.join(
      uploadsDirectory,
      path.basename(photo.providerAssetId || photo.sourceUrl || photo.url)
    );
  }

  return {
    getDownloadUrl,
    getLocalFilePath,
    getPreviewUrl,
    uploadImage
  };
}

module.exports = {
  createMediaService
};
