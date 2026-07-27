const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const getUploadDir = () => {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production') {
    return '/tmp/uploads';
  }
  return path.join(__dirname, '../../uploads');
};

const uploadDir = getUploadDir();

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('Upload directory creation warning:', err.message);
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

  // Base64 Data URL fallback for cloud & serverless compatibility (ensures images work on mobile & Vercel)
  try {
    const fileBuffer = fs.readFileSync(file.path);
    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${file.mimetype || 'image/jpeg'};base64,${base64Data}`;
    
    // Clean up temp file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    const uniqueId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      url: dataUrl,
      publicId: uniqueId,
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname
    };
  } catch (err) {
    console.error('Base64 image conversion error:', err);
    const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const targetPath = path.join(uploadDir, filename);
    if (fs.existsSync(file.path)) {
      try { fs.renameSync(file.path, targetPath); } catch (e) {}
    }
    return {
      url: `${hostUrl}/uploads/${filename}`,
      publicId: filename,
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname
    };
  }
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
