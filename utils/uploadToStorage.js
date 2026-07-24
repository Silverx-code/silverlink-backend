const crypto = require('crypto');
const path = require('path');
const { supabase } = require('../config/supabase');
const ApiError = require('./ApiError');

/**
 * Uploads a buffer (from multer's memoryStorage) to a Supabase Storage bucket
 * and returns its public URL — a drop-in replacement for what
 * multer-storage-cloudinary used to hand back as `req.file.path`.
 *
 * @param {Buffer} buffer - file contents (req.file.buffer)
 * @param {string} originalname - original filename (req.file.originalname)
 * @param {string} bucket - Supabase Storage bucket name, e.g. 'logos' or 'cvs'
 * @param {string} mimetype - req.file.mimetype
 */
async function uploadToStorage(buffer, originalname, bucket, mimetype) {
  const ext = path.extname(originalname);
  const filename = `${crypto.randomUUID()}${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(filename, buffer, {
    contentType: mimetype,
    upsert: false,
  });

  if (error) {
    throw new ApiError(500, `Failed to upload file to storage: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

module.exports = { uploadToStorage };
