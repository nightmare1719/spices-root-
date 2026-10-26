import multer from 'multer';
import path from 'path';
import fs from 'fs';

const PRIVATE_DIR = path.resolve(process.cwd(), 'private_uploads', 'screenshots');

if (!fs.existsSync(PRIVATE_DIR)) {
  fs.mkdirSync(PRIVATE_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(PRIVATE_DIR)) {
      fs.mkdirSync(PRIVATE_DIR, { recursive: true });
    }
    cb(null, PRIVATE_DIR);
  },
  filename: (req, file, cb) => {
    const rawOrderNumber = (req.body?.orderNumber || req.params?.orderNumber || 'order')
      .replace(/[^a-zA-Z0-9-_]/g, '');
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.png';
    const uniqueSuffix = Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    cb(null, `proof_${rawOrderNumber}_${uniqueSuffix}${safeExt}`);
  }
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const screenshotUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 Megabytes limit
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP payment screenshots are permitted.'));
    }
  }
});
