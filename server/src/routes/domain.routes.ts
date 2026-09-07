import { Router } from 'express';
import { DomainController } from '../controllers/domain.controller';
import { optionalAuthenticate } from '../middlewares/auth';
import { optionalTenantContextMiddleware } from '../middlewares/tenant';

const router = Router();

// Public Host Resolver (resolves tenant by hostname / domain)
router.get('/resolve', DomainController.resolveHost);

// Tenant domain endpoints (supports session or explicit tenantId)
router.get('/status', optionalAuthenticate, optionalTenantContextMiddleware, DomainController.getDomainStatus);
router.post('/add', optionalAuthenticate, optionalTenantContextMiddleware, DomainController.addDomain);
router.post('/verify', optionalAuthenticate, optionalTenantContextMiddleware, DomainController.verifyDomain);
router.delete('/remove', optionalAuthenticate, optionalTenantContextMiddleware, DomainController.removeDomain);
router.delete('/', optionalAuthenticate, optionalTenantContextMiddleware, DomainController.removeDomain);

export default router;
