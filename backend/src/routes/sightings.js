import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.patch('/:id', async (req, res) => {
  try {
    const sighting = await prisma.sighting.findUnique({ where: { id: req.params.id }, include: { property: true } });
    if (!sighting || sighting.property.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    const { cameraId, zoneId, date, type, count, buckId, antlerClass, bodyCondition, notes, photoUrl } = req.body;
    const updated = await prisma.sighting.update({ where: { id: req.params.id }, data: { cameraId: cameraId || null, zoneId: zoneId || null, date: date ? new Date(date) : undefined, type, count: count ? parseInt(count) : undefined, buckId: buckId || null, antlerClass: antlerClass || null, bodyCondition: bodyCondition || null, notes, photoUrl } });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const sighting = await prisma.sighting.findUnique({ where: { id: req.params.id }, include: { property: true } });
    if (!sighting || sighting.property.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    await prisma.sighting.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
