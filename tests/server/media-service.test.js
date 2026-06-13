function createCloudinary() {
  const uploads = [];
  const urls = [];
  return {
    uploads,
    urls,
    config: vi.fn(),
    uploader: {
      upload_stream(options, callback) {
        uploads.push(options);
        return {
          end(buffer) {
            callback(null, {
              public_id: "galleries/gallery-1/photo-1",
              secure_url: "https://res.cloudinary.com/example/authenticated/photo.jpg",
              bytes: buffer.length,
              width: 2000,
              height: 1400,
              format: "jpg"
            });
          }
        };
      }
    },
    url(publicId, options) {
      urls.push({ publicId, options });
      return `https://res.cloudinary.com/example/${publicId}`;
    }
  };
}

describe("Cloudinary media service", () => {
  it("uploads private images as authenticated assets", async () => {
    const cloudinary = createCloudinary();
    const { createMediaService } = require("../../server/services/media");
    const service = createMediaService({
      env: {
        MEDIA_STORAGE: "cloudinary",
        CLOUDINARY_CLOUD_NAME: "example",
        CLOUDINARY_API_KEY: "key",
        CLOUDINARY_API_SECRET: "secret"
      },
      cloudinary
    });

    const result = await service.uploadImage({
      buffer: Buffer.from("photo"),
      filename: "wedding.jpg",
      galleryId: "gallery-1"
    });

    expect(cloudinary.uploads[0]).toEqual(
      expect.objectContaining({
        resource_type: "image",
        type: "authenticated",
        folder: "photography/galleries/gallery-1"
      })
    );
    expect(result.providerAssetId).toContain("photo-1");
    expect(result.storageProvider).toBe("cloudinary");
  });

  it("creates a signed watermarked preview URL", () => {
    const cloudinary = createCloudinary();
    const { createMediaService } = require("../../server/services/media");
    const service = createMediaService({
      env: {
        MEDIA_STORAGE: "cloudinary",
        CLOUDINARY_CLOUD_NAME: "example",
        CLOUDINARY_API_KEY: "key",
        CLOUDINARY_API_SECRET: "secret"
      },
      cloudinary
    });

    service.getPreviewUrl({
      providerAssetId: "galleries/gallery-1/photo-1",
      storageProvider: "cloudinary"
    });

    expect(cloudinary.urls[0].options).toEqual(
      expect.objectContaining({
        type: "authenticated",
        sign_url: true,
        secure: true
      })
    );
    expect(
      JSON.stringify(cloudinary.urls[0].options.transformation)
    ).toContain("PROVA");
    expect(
      JSON.stringify(cloudinary.urls[0].options.transformation)
    ).toContain("#FFF4CC");
  });

  it("creates a separate signed attachment URL for downloads", () => {
    const cloudinary = createCloudinary();
    const { createMediaService } = require("../../server/services/media");
    const service = createMediaService({
      env: {
        MEDIA_STORAGE: "cloudinary",
        CLOUDINARY_CLOUD_NAME: "example",
        CLOUDINARY_API_KEY: "key",
        CLOUDINARY_API_SECRET: "secret"
      },
      cloudinary
    });

    service.getDownloadUrl({
      providerAssetId: "galleries/gallery-1/photo-1",
      storageProvider: "cloudinary"
    });

    expect(cloudinary.urls[0].options).toEqual(
      expect.objectContaining({
        type: "authenticated",
        sign_url: true,
        flags: "attachment"
      })
    );
  });
});
