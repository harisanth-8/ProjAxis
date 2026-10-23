import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import Settings from '../models/Settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${randomName}${ext}`);
  }
});

// Allowed extensions and magic bytes / signatures
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip', '.png', '.jpg', '.jpeg'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`File type '${ext}' is not supported. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }
  cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 // 10MB default
  },
  fileFilter
});

/**
 * Validates file signature / magic numbers after upload to disk.
 * If invalid, unlinks the file and returns false.
 */
export const verifyFileSignature = async (filePath) => {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    const hex = buffer.toString('hex').toLowerCase();

    // Signatures:
    // PDF: %PDF (25 50 44 46)
    // ZIP / DOCX / PPTX: PK (50 4b 03 04)
    // PNG: (89 50 4e 47 0d 0a 1a 0a)
    // JPG: (ff d8 ff)
    // DOC / PPT (CFBF / OLE): (d0 cf 11 e0 a1 b1 1a e1)
    const isPdf = hex.startsWith('25504446');
    const isZipOrOfficeXml = hex.startsWith('504b0304');
    const isPng = hex.startsWith('89504e47');
    const isJpg = hex.startsWith('ffd8ff');
    const isOldOffice = hex.startsWith('d0cf11e0');

    if (isPdf || isZipOrOfficeXml || isPng || isJpg || isOldOffice) {
      return true;
    }

    // If signature check fails, remove malicious/spoofed file
    fs.unlinkSync(filePath);
    return false;
  } catch (err) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return false;
  }
};
