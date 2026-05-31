// Small test uploader: writes a 1x1 PNG and uploads to Cloudinary
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const cloudinary = require('../config/cloudinary');

(async () => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary config missing in .env');
      process.exit(2);
    }

    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='; // 1x1 PNG
    const buf = Buffer.from(base64, 'base64');
    const tmpPath = path.resolve(__dirname, 'tmp-upload.png');
    fs.writeFileSync(tmpPath, buf);

    const folder = process.env.CLOUDINARY_LEAVE_FOLDER || 'diems/leave-attachments';

    cloudinary.uploader.upload(tmpPath, { folder, resource_type: 'auto' }, (err, result) => {
      try { fs.unlinkSync(tmpPath); } catch (e) {}
      if (err) {
        console.error('UPLOAD_ERROR', err.message || err);
        process.exit(1);
      }
      console.log('UPLOAD_OK', result.secure_url || result.url);
      console.log('PUBLIC_ID', result.public_id);
      process.exit(0);
    });
  } catch (err) {
    console.error('ERROR', err.message || err);
    process.exit(1);
  }
})();
