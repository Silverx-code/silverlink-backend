const supabase = require('../config/supabase');
const config = require('../config');
const ApiError = require('./ApiError');

// Storage path segments and filenames both need sanitizing — real filenames
// (e.g. "Layi_Fakunle_Olasubomi_Professional_CV_(2).docx") contain characters
// Supabase Storage paths don't like (parentheses, spaces).
function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Uploads a buffer (from multer's memoryStorage) to Supabase Storage and returns
 * its public URL. Requires the bucket to already exist and be set to public —
 * see the setup instructions for creating it once via the Supabase dashboard.
 */
async function uploadToStorage(buffer, { folder, filename, contentType }) {
  if (!supabase) {
    throw new ApiError(500, 'File storage is not configured on this server.');
  }

  const path = `${folder}/${Date.now()}-${sanitize(filename)}`;

  const { error } = await supabase.storage
    .from(config.supabase.storageBucket)
    .upload(path, buffer, { contentType, upsert: false });

  if (error) {
    throw new ApiError(502, `File upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(config.supabase.storageBucket).getPublicUrl(path);
  return data.publicUrl;
}

module.exports = uploadToStorage;
