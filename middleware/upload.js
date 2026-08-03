const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Files land in memory as a buffer (req.file.buffer) rather than being streamed
// straight to a storage provider here — the actual upload to Supabase Storage
// happens in the controller, via utils/uploadToStorage.js, once we know which
// folder (cvs/ vs logos/) and DB field it belongs to.
const memoryStorage = multer.memoryStorage();

// Matched against the file's mimetype AND extension — mimetype alone can be spoofed
// or reported inconsistently by different browsers/OSes, so we check both and accept
// either matching.
const ALLOWED_CV_TYPES = [
  { mimetype: 'application/pdf', ext: '.pdf' },
  { mimetype: 'application/msword', ext: '.doc' },
  { mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: '.docx' },
];

function cvFileFilter(req, file, cb) {
  const nameLower = file.originalname.toLowerCase();
  const matches = ALLOWED_CV_TYPES.some(
    (t) => file.mimetype === t.mimetype || nameLower.endsWith(t.ext)
  );
  if (!matches) {
    return cb(new ApiError(400, 'CV must be a PDF, DOC, or DOCX file.'));
  }
  return cb(null, true);
}

const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function logoFileFilter(req, file, cb) {
  if (!ALLOWED_LOGO_TYPES.includes(file.mimetype)) {
    return cb(new ApiError(400, 'Logo must be a JPG, PNG, or WEBP image.'));
  }
  return cb(null, true);
}

const uploadLogo = multer({
  storage: memoryStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: logoFileFilter,
}).single('logo');

const uploadCv = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: cvFileFilter,
}).single('cv');

module.exports = { uploadLogo, uploadCv };
