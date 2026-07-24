const multer = require('multer');

// Files are held in memory as a buffer, then handed off to
// utils/uploadToStorage.js to push into Supabase Storage. Nothing is ever
// written to Render's (ephemeral) local disk.
const memoryStorage = multer.memoryStorage();

const uploadLogo = multer({
  storage: memoryStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Logo must be a JPG, PNG, or WEBP image'));
    }
    cb(null, true);
  },
}).single('logo');

const uploadCv = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('CV must be a PDF, DOC, or DOCX file'));
    }
    cb(null, true);
  },
}).single('cv');

module.exports = { uploadLogo, uploadCv };
