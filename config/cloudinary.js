const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const config = require('./index');

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const logoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'silverlink/logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'limit' }],
  },
});

const cvStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'silverlink/cvs',
    resource_type: 'raw', // PDFs/docs are not images
    // Deliberately no `allowed_formats` here — Cloudinary's own format validation for
    // raw resources doesn't reliably recognize legitimate types like docx (a documented
    // Cloudinary quirk: https://cloudinary.com/documentation/upload_images#uploading_non_media_files_as_raw_files),
    // rejecting valid files with a misleading "unknown file format" error. File-type
    // validation happens in middleware/upload.js's fileFilter instead, before the file
    // ever reaches Cloudinary — we control that allowlist directly instead of depending
    // on Cloudinary's.
  },
});

module.exports = { cloudinary, logoStorage, cvStorage };
