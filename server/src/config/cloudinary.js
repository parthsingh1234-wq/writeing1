const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

let isCloudinaryConfigured = false;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  isCloudinaryConfigured = true;
  console.log('Cloudinary storage successfully initialized.');
} else {
  console.log('Cloudinary credentials missing. Uploads will be stored locally in /uploads directory.');
}

const saveImageFile = async (file, hostUrl) => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'article_vault',
        resource_type: 'auto'
      });
      // Clean up temp local file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return {
        url: result.secure_url,
        publicId: result.public_id,
        size: result.bytes,
        mimeType: file.mimetype,
        originalName: file.originalname
      };
    } catch (err) {
      console.error('Cloudinary upload failed, falling back to local file storage:', err.message);
    }
  }

  // Local storage fallback
  const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const targetPath = path.join(uploadDir, filename);

  fs.renameSync(file.path, targetPath);

  const fileUrl = `${hostUrl}/uploads/${filename}`;
  return {
    url: fileUrl,
    publicId: filename,
    size: file.size,
    mimeType: file.mimetype,
    originalName: file.originalname
  };
};

const deleteImageFile = async (publicId) => {
  if (isCloudinaryConfigured && !publicId.includes('.')) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (err) {
      console.error('Cloudinary delete failed:', err.message);
    }
  }

  // Local file delete
  const localPath = path.join(uploadDir, publicId);
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
    return true;
  }
  return false;
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured: () => isCloudinaryConfigured,
  saveImageFile,
  deleteImageFile
};
