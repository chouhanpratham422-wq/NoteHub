import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

// File filter: strict PDF validation
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (
    ext === '.pdf' &&
    (mime === 'application/pdf' || mime === 'application/x-pdf')
  ) {
    cb(null, true);
  } else {
    cb(new Error('File must be a PDF'), false);
  }
};

// Maximum PDF size: 100 MB
export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter,
});