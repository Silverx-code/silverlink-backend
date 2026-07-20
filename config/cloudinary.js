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
    allowed_formats: ['pdf', 'doc', 'docx'],
  },
});

module.exports = { cloudinary, logoStorage, cvStorage };
