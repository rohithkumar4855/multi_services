import { Router, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';
import { authenticate } from '../middlewares/auth';
import { tenantContextMiddleware, TenantRequest } from '../middlewares/tenant';
import { AuditService } from '../services/audit.service';

const router = Router();

// Get files for current tenant
router.get('/', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const files = await prisma.fileRecord.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { createdAt: 'desc' }
    });

    sendResponse(res, 200, 'Files retrieved successfully', files);
  } catch (err) {
    next(err);
  }
});

// Upload / Register file metadata (base64 or remote URL)
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
        mimeType: mimeType || 'image/png'
      }
    });

    await AuditService.log({
      tenantId,
      userId: req.user?.id,
      action: 'FILE_UPLOADED',
      entityType: 'FILE',
      entityId: file.id,
      newValue: { fileName, fileType }
    });

    sendResponse(res, 201, 'File saved successfully', file);
  } catch (err) {
    next(err);
  }
});

// Delete file
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

    await prisma.fileRecord.delete({ where: { id } });

    await AuditService.log({
      tenantId: req.tenantId!,
      userId: req.user?.id,
      action: 'FILE_DELETED',
      entityType: 'FILE',
      entityId: id,
      oldValue: { fileName: file.fileName }
    });

    sendResponse(res, 200, 'File deleted successfully');
  } catch (err) {
    next(err);
  }
});

export default router;
