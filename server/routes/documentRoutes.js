import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';
import {
  uploadDocument,
  getDocuments,
  downloadDocument,
  deleteDocument
} from '../controllers/documentController.js';

const router = express.Router();

router.use(authenticate);

router.post('/upload', uploadMiddleware.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deleteDocument);

export default router;
