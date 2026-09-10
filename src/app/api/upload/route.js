import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import { handler, ok, fail, body } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = {
  jpg: 'jpg',
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  gif: 'gif',
};

/**
 * Accepts a base64 data URL and stores it under /public/uploads.
 */
export const POST = handler(async (req) => {
  await requireAdmin()

  const b = await body(req);
  const data = String(b.data || '');

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(data);

  if (!match) {
    return fail('Please upload a JPG, PNG, WEBP or GIF image');
  }

  const [, claimedMime, b64] = match;

  let buf;

  try {
    buf = Buffer.from(b64, 'base64');
  } catch {
    return fail('Invalid image data');
  }

  if (!buf.length) {
    return fail('Invalid image data');
  }

  if (buf.length > MAX_BYTES) {
    return fail('Image is larger than 4 MB');
  }

  // Check the actual file contents instead of trusting
  // the MIME type supplied by the browser.
  const detected = await fileTypeFromBuffer(buf);

  if (!detected || !ALLOWED_TYPES[detected.ext]) {
    return fail('The uploaded file is not a supported image');
  }

  const ext = ALLOWED_TYPES[detected.ext];

  const expectedMime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  if (claimedMime !== expectedMime) {
    return fail('Image type does not match the file contents');
  }

  const dir = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdirSync(dir, { recursive: true });

  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

  fs.writeFileSync(path.join(dir, name), buf);

  return ok({ url: `/uploads/${name}` });
});