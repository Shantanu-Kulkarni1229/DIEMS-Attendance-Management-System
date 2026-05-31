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

  const folder = process.env.CLOUDINARY_LEAVE_FOLDER || 'diems/leave-attachments';
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!uploadPreset) {
    res.status(500);
    throw new Error('Cloudinary upload preset is not configured');
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, {
    folder,
    resource_type: 'auto',
    upload_preset: uploadPreset
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