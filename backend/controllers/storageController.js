const supabase = require('../db');

const uploadFile = async (req, res) => {
  try {
    const { file, bucket = 'service-proofs', fileName } = req.body || {};

    if (!file || typeof file !== 'string') {
      return res.status(400).json({ error: 'A valid base64 file data string is required.' });
    }

    // Generate unique file path
    const timestamp = Date.now();
    const cleanFileName = (fileName || `upload_${timestamp}.jpg`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${req.user?.user_id || 'anonymous'}/${timestamp}_${cleanFileName}`;

    // Extract mime type and raw buffer from data URL
    let mimeType = 'image/jpeg';
    let base64Data = file;

    const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const buffer = Buffer.from(base64Data, 'base64');

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        return res.status(200).json({
          url: publicUrlData.publicUrl,
          path: filePath,
          bucket,
          storage: 'supabase',
        });
      }
    } catch (storageErr) {
      console.warn(`[Storage Warning] Supabase storage bucket '${bucket}' unavailable: ${storageErr.message}`);
    }

    // Fallback: return data URL safely if bucket is unconfigured
    return res.status(200).json({
      url: file,
      path: filePath,
      bucket,
      storage: 'inline-fallback',
      note: `Saved as inline image. Run migrations and create Supabase bucket '${bucket}' for CDN storage.`,
    });
  } catch (err) {
    console.error('Upload file error:', err);
    return res.status(500).json({ error: 'Internal server error while uploading file.' });
  }
};

module.exports = { uploadFile };
