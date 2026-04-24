import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Helper: verify property belongs to user
async function getProperty(id, userId) {
  const p = await prisma.property.findUnique({ where: { id } });
  if (!p || p.userId !== userId) return null;
  return p;
}

// GET / - list properties
router.get('/', async (req, res) => {
  try {
    const props = await prisma.property.findMany({
      where: { userId: req.user.id },
      include: { _count: { select: { zones: true, cameras: true, bucks: true, sightings: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(props);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST / - create property
router.post('/', async (req, res) => {
  try {
    const { name, acreage, state, county, notes } = req.body;
    const prop = await prisma.property.create({ data: { name, acreage: parseFloat(acreage), state, county, notes, userId: req.user.id } });
    res.json(prop);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /:id - property detail
router.get('/:id', async (req, res) => {
  try {
    const prop = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        zones: true,
        cameras: { include: { zone: true, _count: { select: { sightings: true } } } },
        bucks: { include: { _count: { select: { sightings: true } } } },
      }
    });
    if (!prop || prop.userId !== req.user.id) return res.status(404).json({ error: 'Not found' });
    res.json(prop);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /:id
router.patch('/:id', async (req, res) => {
  try {
    if (!await getProperty(req.params.id, req.user.id)) return res.status(404).json({ error: 'Not found' });
    const { name, acreage, state, county, notes } = req.body;
    const prop = await prisma.property.update({ where: { id: req.params.id }, data: { name, acreage: acreage ? parseFloat(acreage) : undefined, state, county, notes } });
    res.json(prop);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    if (!await getProperty(req.params.id, req.user.id)) return res.status(404).json({ error: 'Not found' });
    await prisma.property.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /:id/stats
router.get('/:id/stats', async (req, res) => {
  try {
    if (!await getProperty(req.params.id, req.user.id)) return res.status(404).json({ error: 'Not found' });
    const seasonStart = new Date(new Date().getFullYear(), 0, 1);
    const propertyId = req.params.id;

    const sightings = await prisma.sighting.findMany({ where: { propertyId, date: { gte: seasonStart } } });
    const harvests = await prisma.harvest.findMany({ where: { propertyId, date: { gte: seasonStart } } });
    const cameras = await prisma.camera.findMany({ where: { propertyId } });
    const improvements = await prisma.landImprovement.findMany({ where: { propertyId } });
    const bucks = await prisma.buck.findMany({ where: { propertyId } });

    const buckSightings = sightings.filter(s => s.type === 'BUCK');
    const doeSightings = sightings.filter(s => s.type === 'DOE');
    const fawnSightings = sightings.filter(s => s.type === 'FAWN');
    const buckCount = buckSightings.reduce((a, s) => a + s.count, 0);
    const doeCount = doeSightings.reduce((a, s) => a + s.count, 0);
    const fawnCount = fawnSightings.reduce((a, s) => a + s.count, 0);
    const ratio = doeCount > 0 ? (buckCount / doeCount).toFixed(2) : 'N/A';

    // Herd health score
    const ratioScore = doeCount > 0 ? Math.min(40, (0.5 / (buckCount / doeCount)) * 40) : 20;
    const conditionMap = { EXCELLENT: 100, GOOD: 75, FAIR: 50, POOR: 25 };
    const conditioned = sightings.filter(s => s.bodyCondition);
    const avgCondition = conditioned.length > 0 ? conditioned.reduce((a, s) => a + conditionMap[s.bodyCondition], 0) / conditioned.length : 60;
    const conditionScore = (avgCondition / 100) * 30;
    const fawnRecruit = doeCount > 0 ? Math.min(30, (fawnCount / (doeCount * 0.6)) * 30) : 15;
    const herdHealthScore = Math.round(ratioScore + conditionScore + fawnRecruit);

    const uniqueBucks = new Set(sightings.filter(s => s.buckId).map(s => s.buckId)).size;

    res.json({
      totalSightings: sightings.length,
      buckSightings: buckCount,
      doeSightings: doeCount,
      fawnSightings: fawnCount,
      buckDoeRatio: ratio,
      uniqueBucks,
      harvestsThisSeason: harvests.length,
      activeCameras: cameras.filter(c => c.active).length,
      improvementCount: improvements.length,
      herdHealthScore,
      totalBucks: bucks.length,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- ZONES sub-router ----
const zonesRouter = Router({ mergeParams: true });
router.use('/:propertyId/zones', zonesRouter);

zonesRouter.get('/', async (req, res) => {
  try {
    const zones = await prisma.zone.findMany({
      where: { propertyId: req.params.propertyId },
      include: { _count: { select: { sightings: true, cameras: true } } }
    });
    res.json(zones);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

zonesRouter.post('/', async (req, res) => {
  try {
    const { name, type, acreage, notes, lat, lng } = req.body;
    const zone = await prisma.zone.create({
      data: {
        propertyId: req.params.propertyId,
        name, type,
        acreage: acreage ? parseFloat(acreage) : null,
        notes,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null
      }
    });
    res.json(zone);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

zonesRouter.patch('/:zoneId', async (req, res) => {
  try {
    const { name, type, acreage, notes, lat, lng } = req.body;
    const zone = await prisma.zone.update({
      where: { id: req.params.zoneId },
      data: {
        name, type,
        acreage: acreage ? parseFloat(acreage) : undefined,
        notes,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined
      }
    });
    res.json(zone);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

zonesRouter.delete('/:zoneId', async (req, res) => {
  try {
    await prisma.zone.delete({ where: { id: req.params.zoneId } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- CAMERAS sub-router ----
const camerasRouter = Router({ mergeParams: true });
router.use('/:propertyId/cameras', camerasRouter);

camerasRouter.get('/', async (req, res) => {
  try {
    const cameras = await prisma.camera.findMany({
      where: { propertyId: req.params.propertyId },
      include: {
        zone: true,
        _count: { select: { sightings: true } },
        sightings: { orderBy: { date: 'desc' }, take: 1 }
      }
    });
    res.json(cameras);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

camerasRouter.post('/', async (req, res) => {
  try {
    const { name, zoneId, lat, lng, active, installedAt, notes } = req.body;
    const camera = await prisma.camera.create({
      data: {
        propertyId: req.params.propertyId,
        name,
        zoneId: zoneId || null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        active: active !== false,
        installedAt: installedAt ? new Date(installedAt) : null,
        notes
      }
    });
    res.json(camera);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

camerasRouter.patch('/:cameraId', async (req, res) => {
  try {
    const { name, zoneId, lat, lng, active, notes } = req.body;
    const camera = await prisma.camera.update({
      where: { id: req.params.cameraId },
      data: {
        name,
        zoneId: zoneId || null,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        active,
        notes
      }
    });
    res.json(camera);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

camerasRouter.delete('/:cameraId', async (req, res) => {
  try {
    await prisma.camera.delete({ where: { id: req.params.cameraId } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- BUCKS sub-router ----
const bucksRouter = Router({ mergeParams: true });
router.use('/:propertyId/bucks', bucksRouter);

bucksRouter.get('/', async (req, res) => {
  try {
    const bucks = await prisma.buck.findMany({
      where: { propertyId: req.params.propertyId },
      include: {
        sightings: { orderBy: { date: 'desc' }, take: 10 },
        harvests: true,
        _count: { select: { sightings: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(bucks);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

bucksRouter.post('/', async (req, res) => {
  try {
    const { name, firstSeenYear, estimatedAge, notes, photoUrl } = req.body;
    const buck = await prisma.buck.create({
      data: {
        propertyId: req.params.propertyId,
        name,
        firstSeenYear: parseInt(firstSeenYear),
        estimatedAge: estimatedAge ? parseInt(estimatedAge) : null,
        notes,
        photoUrl
      }
    });
    res.json(buck);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

bucksRouter.patch('/:buckId', async (req, res) => {
  try {
    const { name, firstSeenYear, estimatedAge, notes, photoUrl, harvested, harvestedAt } = req.body;
    const buck = await prisma.buck.update({
      where: { id: req.params.buckId },
      data: {
        name,
        firstSeenYear: firstSeenYear ? parseInt(firstSeenYear) : undefined,
        estimatedAge: estimatedAge ? parseInt(estimatedAge) : undefined,
        notes,
        photoUrl,
        harvested,
        harvestedAt: harvestedAt ? new Date(harvestedAt) : undefined
      }
    });
    res.json(buck);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

bucksRouter.delete('/:buckId', async (req, res) => {
  try {
    await prisma.buck.delete({ where: { id: req.params.buckId } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- SIGHTINGS sub-router (under property) ----
const sightingsSubRouter = Router({ mergeParams: true });
router.use('/:propertyId/sightings', sightingsSubRouter);

sightingsSubRouter.get('/', async (req, res) => {
  try {
    const { cameraId, zoneId, startDate, endDate, type } = req.query;
    const where = { propertyId: req.params.propertyId };
    if (cameraId) where.cameraId = cameraId;
    if (zoneId) where.zoneId = zoneId;
    if (type) where.type = type;
    if (startDate || endDate) where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
    const sightings = await prisma.sighting.findMany({
      where,
      include: { camera: true, zone: true, buck: true },
      orderBy: { date: 'desc' }
    });
    res.json(sightings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

sightingsSubRouter.post('/', async (req, res) => {
  try {
    const { cameraId, zoneId, date, type, count, buckId, antlerClass, bodyCondition, notes, photoUrl } = req.body;
    const sighting = await prisma.sighting.create({
      data: {
        propertyId: req.params.propertyId,
        cameraId: cameraId || null,
        zoneId: zoneId || null,
        date: new Date(date),
        type,
        count: parseInt(count) || 1,
        buckId: buckId || null,
        antlerClass: antlerClass || null,
        bodyCondition: bodyCondition || null,
        notes,
        photoUrl
      }
    });
    res.json(sighting);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- IMPROVEMENTS sub-router ----
const improvementsRouter = Router({ mergeParams: true });
router.use('/:propertyId/improvements', improvementsRouter);

improvementsRouter.get('/', async (req, res) => {
  try {
    const improvements = await prisma.landImprovement.findMany({
      where: { propertyId: req.params.propertyId },
      include: { zone: true },
      orderBy: { date: 'desc' }
    });
    res.json(improvements);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

improvementsRouter.post('/', async (req, res) => {
  try {
    const { zoneId, type, description, date, acreage, species, cost, notes } = req.body;
    const imp = await prisma.landImprovement.create({
      data: {
        propertyId: req.params.propertyId,
        zoneId: zoneId || null,
        type, description,
        date: new Date(date),
        acreage: acreage ? parseFloat(acreage) : null,
        species,
        cost: cost ? parseFloat(cost) : null,
        notes
      }
    });
    res.json(imp);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

improvementsRouter.patch('/:impId', async (req, res) => {
  try {
    const { zoneId, type, description, date, acreage, species, cost, notes } = req.body;
    const imp = await prisma.landImprovement.update({
      where: { id: req.params.impId },
      data: {
        zoneId: zoneId || null,
        type, description,
        date: date ? new Date(date) : undefined,
        acreage: acreage ? parseFloat(acreage) : undefined,
        species,
        cost: cost ? parseFloat(cost) : undefined,
        notes
      }
    });
    res.json(imp);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

improvementsRouter.delete('/:impId', async (req, res) => {
  try {
    await prisma.landImprovement.delete({ where: { id: req.params.impId } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- HARVESTS sub-router ----
const harvestsRouter = Router({ mergeParams: true });
router.use('/:propertyId/harvests', harvestsRouter);

harvestsRouter.get('/', async (req, res) => {
  try {
    const harvests = await prisma.harvest.findMany({
      where: { propertyId: req.params.propertyId },
      include: { buck: true },
      orderBy: { date: 'desc' }
    });
    res.json(harvests);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

harvestsRouter.post('/', async (req, res) => {
  try {
    const { buckId, zoneId, date, type, weight, ageEstimate, mainBeams, spread, points, notes } = req.body;
    const harvest = await prisma.harvest.create({
      data: {
        propertyId: req.params.propertyId,
        buckId: buckId || null,
        zoneId: zoneId || null,
        date: new Date(date),
        type,
        weight: weight ? parseFloat(weight) : null,
        ageEstimate: ageEstimate ? parseInt(ageEstimate) : null,
        mainBeams: mainBeams ? parseFloat(mainBeams) : null,
        spread: spread ? parseFloat(spread) : null,
        points: points ? parseInt(points) : null,
        notes
      }
    });
    if (buckId) {
      await prisma.buck.update({ where: { id: buckId }, data: { harvested: true, harvestedAt: new Date(date) } });
    }
    res.json(harvest);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

harvestsRouter.patch('/:harvestId', async (req, res) => {
  try {
    const { buckId, zoneId, date, type, weight, ageEstimate, mainBeams, spread, points, notes } = req.body;
    const harvest = await prisma.harvest.update({
      where: { id: req.params.harvestId },
      data: {
        buckId: buckId || null,
        zoneId: zoneId || null,
        date: date ? new Date(date) : undefined,
        type,
        weight: weight ? parseFloat(weight) : undefined,
        ageEstimate: ageEstimate ? parseInt(ageEstimate) : undefined,
        mainBeams: mainBeams ? parseFloat(mainBeams) : undefined,
        spread: spread ? parseFloat(spread) : undefined,
        points: points ? parseInt(points) : undefined,
        notes
      }
    });
    res.json(harvest);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

harvestsRouter.delete('/:harvestId', async (req, res) => {
  try {
    await prisma.harvest.delete({ where: { id: req.params.harvestId } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---- SOIL TESTS sub-router ----
const soilTestsRouter = Router({ mergeParams: true });
router.use('/:propertyId/soil-tests', soilTestsRouter);

soilTestsRouter.get('/', async (req, res) => {
  try {
    const tests = await prisma.soilTest.findMany({
      where: { propertyId: req.params.propertyId },
      include: { zone: true },
      orderBy: { date: 'desc' }
    });
    res.json(tests);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

soilTestsRouter.post('/', async (req, res) => {
  try {
    const { zoneId, date, ph, nitrogen, phosphorus, potassium, notes } = req.body;
    const test = await prisma.soilTest.create({
      data: {
        propertyId: req.params.propertyId,
        zoneId: zoneId || null,
        date: new Date(date),
        ph: ph ? parseFloat(ph) : null,
        nitrogen: nitrogen ? parseFloat(nitrogen) : null,
        phosphorus: phosphorus ? parseFloat(phosphorus) : null,
        potassium: potassium ? parseFloat(potassium) : null,
        notes
      }
    });
    res.json(test);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

soilTestsRouter.patch('/:testId', async (req, res) => {
  try {
    const { zoneId, date, ph, nitrogen, phosphorus, potassium, notes } = req.body;
    const test = await prisma.soilTest.update({
      where: { id: req.params.testId },
      data: {
        zoneId: zoneId || null,
        date: date ? new Date(date) : undefined,
        ph: ph ? parseFloat(ph) : undefined,
        nitrogen: nitrogen ? parseFloat(nitrogen) : undefined,
        phosphorus: phosphorus ? parseFloat(phosphorus) : undefined,
        potassium: potassium ? parseFloat(potassium) : undefined,
        notes
      }
    });
    res.json(test);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

soilTestsRouter.delete('/:testId', async (req, res) => {
  try {
    await prisma.soilTest.delete({ where: { id: req.params.testId } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
