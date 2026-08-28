import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response';
import { AppError } from '../utils/errors';

const router = Router();

// Create a new lead in database
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, name, phone, email, serviceInterest, notes, status } = req.body;
    if (!tenantId || !name || !phone) {
      return next(new AppError('tenantId, name, and phone are required to capture a lead', 400));
    }

    const lead = await prisma.lead.create({
      data: {
        tenantId: String(tenantId),
        name,
        phone,
        email: email || '',
        serviceInterest: serviceInterest || '',
        notes: notes || '',
        status: status || 'new'
      }
    });

    sendResponse(res, 201, 'Lead created and saved to database successfully', lead);
  } catch (err) {
    next(err);
  }
});

// Retrieve leads (optionally filtered by tenantId)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.query.tenantId as string;
    const where = tenantId ? { tenantId } : {};
    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    sendResponse(res, 200, 'Leads retrieved successfully', leads);
  } catch (err) {
    next(err);
  }
});

// Update a lead
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, phone, email, serviceInterest, notes, status } = req.body;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(serviceInterest !== undefined && { serviceInterest }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status })
      }
    });

    sendResponse(res, 200, 'Lead updated successfully', lead);
  } catch (err) {
    next(err);
  }
});

// Delete a lead
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.lead.delete({ where: { id } });
    sendResponse(res, 200, 'Lead deleted successfully', null);
  } catch (err) {
    next(err);
  }
});

export default router;
