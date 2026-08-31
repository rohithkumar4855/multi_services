import { Router, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';
import { AuditService } from '../services/audit.service';
import { authenticate, authorize } from '../middlewares/auth';
import { tenantContextMiddleware, TenantRequest } from '../middlewares/tenant';

const router = Router();

// Get audit logs for current tenant
router.get('/tenant', authenticate, tenantContextMiddleware, async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await AuditService.getTenantLogs(req.tenantId!, 100);
    sendResponse(res, 200, 'Tenant audit logs retrieved', logs);
  } catch (err) {
    next(err);
  }
});

// Super Admin: Get global platform audit logs
router.get('/global', authenticate, authorize('SUPER_ADMIN'), async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await AuditService.getGlobalLogs(150);
    sendResponse(res, 200, 'Global audit logs retrieved', logs);
  } catch (err) {
    next(err);
  }
});

export default router;
