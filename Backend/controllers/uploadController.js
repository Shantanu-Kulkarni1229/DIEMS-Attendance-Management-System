const asyncHandler = require('express-async-handler');
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

const uploadBufferToCloudinary = (buffer, options = {}) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
    if (error) {
      reject(error);
      return;
    }
    resolve(result);
  });

  Readable.from(buffer).pipe(stream);
});

exports.uploadLeaveAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('attachment file is required');
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    res.status(500);
    throw new Error('Cloudinary is not configured');
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, {
    folder: process.env.CLOUDINARY_LEAVE_FOLDER || 'diems/leave-attachments',
    resource_type: 'auto'
  });

  res.status(201).json({
    url: result.secure_url,
    publicId: result.public_id,
    originalName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    format: result.format
  });
});