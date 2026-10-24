import {SERVER_IMAGE_MIME_TYPES} from '@appManagers/constants';
import {makeMediaSize} from '@helpers/mediaSize';
import {exteralessSettings} from '@stores/exteralessSettings';

const PHOTO_SIDE_LIMIT = 2560;
// * exteraless alwaysSendInHD off = Android's SD: the smaller side limit and
// * the compressed re-encode, so the toggle does to the web pipeline what the
// * PhotoEntry quality flag does on the phone
const PHOTO_SD_SIDE_LIMIT = 1280;
export const PHOTO_HEAVY_BYTES = 2 * 1024 * 1024;
export const PHOTO_COMPRESSED_QUALITY = .9;
// The source size above only predicts the ENCODED size for the formats it names; a
// lossy source (HEIC, WEBP, AVIF) is small on disk yet re-encodes to ~12MB at full
// quality when it is detailed. So the encoded result is checked too, and only a
// result over this budget is compressed — anything that already fits is left alone.
export const PHOTO_MAX_BYTES = 6 * 1024 * 1024;

/** Preserve small photos; resize oversized ones and compress heavy lossless uploads. */
export default function photoUploadPreparation(
  width: number,
  height: number,
  mimeType: MTMimeType,
  fileSize: number,
  convertIncompatible = false
) {
  const sd = !exteralessSettings.OEChatsAlwaysSendInHD;
  const sideLimit = sd ? PHOTO_SD_SIDE_LIMIT : PHOTO_SIDE_LIMIT;
  const heavy = (mimeType === 'image/png' || mimeType === 'image/bmp') && fileSize > PHOTO_HEAVY_BYTES;
  if(mimeType === 'image/gif' || !(
    Math.max(width, height) > sideLimit || heavy ||
    convertIncompatible && !SERVER_IMAGE_MIME_TYPES.has(mimeType)
  )) return;

  return {
    boxSize: makeMediaSize(Math.min(width, sideLimit), Math.min(height, sideLimit)),
    mediaSize: makeMediaSize(width, height),
    quality: (heavy || sd) ? PHOTO_COMPRESSED_QUALITY : undefined
  };
}
