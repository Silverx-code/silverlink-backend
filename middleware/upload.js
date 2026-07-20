const multer = require('multer');
const { logoStorage, cvStorage } = require('../config/cloudinary');

const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
}).single('logo');

const uploadCv = multer({
  storage: cvStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('cv');

module.exports = { uploadLogo, uploadCv };
