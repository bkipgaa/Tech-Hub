const { cloudinary } = require('../config/cloudinary');

// resourceType must match how the file was stored ('image' covers photos and
// PDFs, 'video' covers videos) — otherwise Cloudinary silently keeps the file.
exports.deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
  }
};
// Delete the Cloudinary files of portfolio items that are in oldItems but not
// in newItems (removed, or replaced with a new upload). Call after saving.
exports.deleteRemovedPortfolioMedia = async (oldItems = [], newItems = []) => {
  const kept = new Set(newItems.flatMap((i) => [i.publicId, i.mediaUrl].filter(Boolean)));
  for (const item of oldItems) {
    if ((item.publicId && kept.has(item.publicId)) || kept.has(item.mediaUrl)) continue;
    const resourceType = item.mediaType === 'video' ? 'video' : 'image';
    let publicId = item.publicId;
    if (!publicId && item.mediaUrl?.includes('cloudinary.com')) {
      // Older items: recover the public_id from the URL
      publicId = item.mediaUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)?.[1];
    }
    await exports.deleteFromCloudinary(publicId, resourceType);
  }
};
