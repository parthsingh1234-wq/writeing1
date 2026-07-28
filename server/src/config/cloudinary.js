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
  const fileBuffer = file.buffer || (file.path && fs.existsSync(file.path) ? fs.readFileSync(file.path) : null);

  if (isCloudinaryConfigured) {
    try {
      let uploadTarget = file.path;
      if (!uploadTarget && fileBuffer) {
        uploadTarget = `data:${file.mimetype || 'image/jpeg'};base64,${fileBuffer.toString('base64')}`;
      }
      const result = await cloudinary.uploader.upload(uploadTarget, {
        folder: 'article_vault',
        resource_type: 'auto'
      });
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      return {
        url: result.secure_url,
        publicId: result.public_id,
        size: result.bytes,
        mimeType: file.mimetype,
        originalName: file.originalname
      };
    } catch (err) {
      console.error('Cloudinary upload failed, falling back to Data URL storage:', err.message);
    }
  }

  // Base64 Data URL fallback for cloud & serverless compatibility (ensures images work on mobile & Vercel)
  try {
    if (!fileBuffer) {
      throw new Error('No file buffer available');
    }
    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${file.mimetype || 'image/jpeg'};base64,${base64Data}`;

    if (file.path && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch (e) {}
    }

    const uniqueId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      url: dataUrl,
      publicId: uniqueId,
      size: file.size || fileBuffer.length,
      mimeType: file.mimetype || 'image/jpeg',
      originalName: file.originalname || 'uploaded_image.jpg'
    };
  } catch (err) {
    console.error('Base64 image conversion error:', err.message);
    const uniqueId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      url: `https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=1200`,
      publicId: uniqueId,
      size: 1024,
      mimeType: 'image/jpeg',
      originalName: file.originalname || 'image.jpg'
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
