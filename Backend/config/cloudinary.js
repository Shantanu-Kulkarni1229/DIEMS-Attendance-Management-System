const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

if (cloudName) {
  cloudinary.config({
    cloud_name: cloudName,
    secure: true
  });
}

module.exports = cloudinary;