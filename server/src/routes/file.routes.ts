import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { authenticate, optionalAuthenticate } from '../middlewares/auth';
import { tenantContextMiddleware, optionalTenantContextMiddleware, TenantRequest } from '../middlewares/tenant';
import { AuditService } from '../services/audit.service';
import { StorageService } from '../services/storage.service';

const router = Router();

// Setup Multer for memory buffer uploads (up to 25MB per file)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max limit
  },
});

// Helper to determine file category
function inferFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('msword') || mimeType.includes('sheet') || mimeType.includes('text/')) return 'document';
  return 'other';
}

// 1. Get files for current tenant
router.get('/', optionalAuthenticate, optionalTenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const files = await prisma.fileRecord.findMany({
      where: { tenantId: req.tenantId || 'tenant-vip' },
      orderBy: { createdAt: 'desc' },
    });

    sendResponse(res, 200, 'Files retrieved successfully', files);
  } catch (err) {
    next(err);
  }
});

// 2. Direct Binary File Upload to Supabase S3
router.post('/upload', optionalAuthenticate, optionalTenantContextMiddleware, upload.single('file'), async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next(new AppError('No file provided in form-data ("file" field is required)', 400));
    }

    const tenantId = req.tenantId!;
    const folder = (req.body.folder as string) || 'uploads';

    // Upload to Supabase S3
    const { key, fileUrl, fileSize } = await StorageService.uploadFile({
      tenantId,
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      folder,
    });

    const fileType = inferFileType(req.file.mimetype);

    // Save record in database
    const fileRecord = await prisma.fileRecord.create({
      data: {
        tenantId,
        uploaderId: req.user?.id || null,
        fileName: req.file.originalname,
        fileUrl,
        fileType,
        fileSize,
        mimeType: req.file.mimetype,
      },
    });

    // Audit log
    await AuditService.log({
      tenantId,
      userId: req.user?.id,
      action: 'FILE_UPLOADED',
      entityType: 'FILE',
      entityId: fileRecord.id,
      newValue: {
        fileName: req.file.originalname,
        fileUrl,
        fileType,
        s3Key: key,
        fileSize,
      },
    });

    sendResponse(res, 201, 'File uploaded and stored in Supabase S3 successfully', fileRecord);
  } catch (err) {
    next(err);
  }
});

// 3. Upload / Register file metadata (base64 or remote URL)
router.post('/', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { fileName, fileUrl, fileType, fileSize, mimeType } = req.body;
    const tenantId = req.tenantId!;

    if (!fileName || !fileUrl) {
      return next(new AppError('File name and file URL are required', 400));
    }

    const file = await prisma.fileRecord.create({
      data: {
        tenantId,
        uploaderId: req.user?.id || null,
        fileName,
        fileUrl,
        fileType: fileType || 'image',
        fileSize: fileSize ? Number(fileSize) : 0,
        mimeType: mimeType || 'image/png',
      },
    });

    await AuditService.log({
      tenantId,
      userId: req.user?.id,
      action: 'FILE_REGISTERED',
      entityType: 'FILE',
      entityId: file.id,
      newValue: { fileName, fileType, fileUrl },
    });

    sendResponse(res, 201, 'File metadata saved successfully', file);
  } catch (err) {
    next(err);
  }
});

// 4. Delete file (from database and Supabase S3 if applicable)
router.delete('/:id', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const file = await prisma.fileRecord.findUnique({ where: { id } });

    if (!file) {
      return next(new AppError('File not found', 404));
    }
    if (file.tenantId !== req.tenantId!) {
      return next(new AppError('Forbidden: File belongs to another tenant', 403));
    }

    // Attempt deletion from S3 if it is a Supabase S3 URL
    if (file.fileUrl && file.fileUrl.includes('/multitenant/')) {
      try {
        const s3Key = file.fileUrl.split('/multitenant/')[1];
        if (s3Key) {
          await StorageService.deleteFile(s3Key);
        }
      } catch (s3Err) {
        // Log warning but proceed with DB deletion
      }
    }

    await prisma.fileRecord.delete({ where: { id } });

    await AuditService.log({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      action: 'FILE_DELETED',
      entityType: 'FILE',
      entityId: id,
      oldValue: { fileName: file.fileName, fileUrl: file.fileUrl },
    });

    sendResponse(res, 200, 'File deleted successfully');
  } catch (err) {
    next(err);
  }
});

export default router;
