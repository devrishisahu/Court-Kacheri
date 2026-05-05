import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ApiError from '../utils/ApiError.js';
import { FILE_UPLOAD } from '../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Storage ────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// ─── File Filter — PDF and DOCX only ────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const extOk = FILE_UPLOAD.ALLOWED_EXTENSIONS.test(ext);
  const mimeOk = FILE_UPLOAD.ALLOWED_MIMES.includes(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(
      new ApiError(400, 'Only PDF and DOCX files are allowed'),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: FILE_UPLOAD.MAX_SIZE_BYTES },
});

export default upload;
