/**
 * Cloudinary delivery helpers.
 *
 * Insert an on-the-fly transformation into a res.cloudinary.com URL so the
 * browser downloads a resized, auto-format/quality copy instead of the stored
 * original. Stored files are never touched; this only changes what is
 * delivered (and therefore Cloudinary bandwidth).
 *
 * Non-Cloudinary URLs, PDFs and URLs that already carry a transformation are
 * returned unchanged.
 */

const CLOUDINARY_RE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\/)(.*)$/;

// A path segment like "f_auto,q_auto,w_400" (vs. a version "v123" or a folder).
const TRANSFORM_SEGMENT_RE = /^[a-z]{1,3}_[^/]*$/;

const parse = (url) => {
  if (typeof url !== 'string') return null;
  const match = url.match(CLOUDINARY_RE);
  if (!match) return null;
  const [, prefix, resourceType, rest] = match;
  const firstSegment = rest.split('/')[0];
  if (TRANSFORM_SEGMENT_RE.test(firstSegment)) return null; // already transformed
  return { prefix, resourceType, rest };
};

/**
 * Resized image URL, e.g. cldImage(url, 400) →
 * .../image/upload/f_auto,q_auto,w_400,c_limit/v123/folder/photo.jpg
 */
export const cldImage = (url, width = 800) => {
  const parsed = parse(url);
  if (!parsed || parsed.resourceType !== 'image') return url;
  if (/\.pdf($|\?)/i.test(parsed.rest)) return url;
  return `${parsed.prefix}f_auto,q_auto,w_${width},c_limit/${parsed.rest}`;
};

/**
 * Still-frame poster for a Cloudinary video (first frame, as a resized JPG),
 * so a preview doesn't download the video itself. Returns undefined for
 * non-Cloudinary videos so it can be passed straight to `poster`.
 */
export const cldVideoPoster = (url, width = 800) => {
  const parsed = parse(url);
  if (!parsed || parsed.resourceType !== 'video') return undefined;
  const rest = parsed.rest.replace(/\.[a-z0-9]+(\?.*)?$/i, '.jpg');
  return `${parsed.prefix}so_0,f_auto,q_auto,w_${width},c_limit/${rest}`;
};

// Common sizes
export const AVATAR_WIDTH = 200;
export const CARD_WIDTH = 600;
export const VIEWER_WIDTH = 1600;
