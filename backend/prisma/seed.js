import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding DeerTrack...');

  // Clean up
  await prisma.harvest.deleteMany();
  await prisma.sighting.deleteMany();
  await prisma.landImprovement.deleteMany();
  await prisma.soilTest.deleteMany();
  await prisma.buck.deleteMany();
  await prisma.camera.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('Hunt1234!', 10);
  const user = await prisma.user.create({
    data: { email: 'hunter@deertrack.app', name: 'Hunter Demo', password }
  });

  const property = await prisma.property.create({
    data: {
      userId: user.id,
      name: "Brody's Farm",
      acreage: 320,
      state: 'IL',
      county: 'McLean',
      notes: '320-acre farm in central Illinois. Mix of timber, food plots, and creek bottoms.'
    }
  });

  // Zones
  const zones = await Promise.all([
    prisma.zone.create({ data: { propertyId: property.id, name: 'North Food Plot', type: 'FOOD_PLOT', acreage: 8, lat: 40.505, lng: -89.005, notes: 'Primary food plot. Clover and brassica mix.' } }),
    prisma.zone.create({ data: { propertyId: property.id, name: 'South Bedding', type: 'BEDDING', acreage: 15, lat: 40.495, lng: -89.005, notes: 'Dense bedding area. CRP grass and brush.' } }),
    prisma.zone.create({ data: { propertyId: property.id, name: 'Creek Bottom', type: 'TRAVEL_CORRIDOR', acreage: 5, lat: 40.500, lng: -89.015, notes: 'Main travel corridor along creek.' } }),
    prisma.zone.create({ data: { propertyId: property.id, name: 'East Stand', type: 'STAND_LOCATION', acreage: 2, lat: 40.500, lng: -88.995, notes: 'Summit ladder stand overlooking field edge.' } }),
  ]);
  const [northFoodPlot, southBedding, creekBottom, eastStand] = zones;

  // Cameras
  const cameras = await Promise.all([
    prisma.camera.create({ data: { propertyId: property.id, zoneId: creekBottom.id, name: 'Creek Crossing', lat: 40.500, lng: -89.015, active: true, installedAt: new Date('2024-08-01'), notes: 'Browning Strike Force. Facing east on main crossing.' } }),
    prisma.camera.create({ data: { propertyId: property.id, zoneId: northFoodPlot.id, name: 'Food Plot NE Corner', lat: 40.506, lng: -89.003, active: true, installedAt: new Date('2024-08-15'), notes: 'Reconyx HyperFire 2. Wide angle on food plot.' } }),
    prisma.camera.create({ data: { propertyId: property.id, zoneId: southBedding.id, name: 'Bedding Edge', lat: 40.496, lng: -89.003, active: true, installedAt: new Date('2024-09-01'), notes: 'Stealth Cam. Pointing into bedding entry trail.' } }),
  ]);
  const [creekCam, foodPlotCam, beddingCam] = cameras;

  // Bucks
  const bucks = await Promise.all([
    prisma.buck.create({ data: { propertyId: property.id, name: 'Tall 8', firstSeenYear: 2022, estimatedAge: 4, notes: 'Tall tined 8-pointer. Mainbeams around 22 inches.' } }),
    prisma.buck.create({ data: { propertyId: property.id, name: 'Drop Tine', firstSeenYear: 2021, estimatedAge: 5, notes: 'Unique drop tine on left side. Heavy body.' } }),
    prisma.buck.create({ data: { propertyId: property.id, name: 'Kicker', firstSeenYear: 2023, estimatedAge: 3, notes: 'Kicker point off right G2. Very active on cameras.' } }),
    prisma.buck.create({ data: { propertyId: property.id, name: 'Split Brow', firstSeenYear: 2022, estimatedAge: 4, notes: 'Split brow tine on right side. Typical 10-pointer otherwise.' } }),
    prisma.buck.create({ data: { propertyId: property.id, name: 'Big Mainframe', firstSeenYear: 2020, estimatedAge: 6, notes: 'The biggest buck on the property. 160+ class mainframe 10.' } }),
  ]);
  const [tall8, dropTine, kicker, splitBrow, bigMainframe] = bucks;

  // Sightings (20 spanning Aug-Nov 2024)
  const sightingData = [
    { cameraId: creekCam.id, zoneId: creekBottom.id, date: '2024-08-10', type: 'BUCK', count: 1, buckId: tall8.id, antlerClass: 'SHOOTER', bodyCondition: 'GOOD' },
    { cameraId: foodPlotCam.id, zoneId: northFoodPlot.id, date: '2024-08-12', type: 'DOE', count: 3, bodyCondition: 'GOOD' },
    { cameraId: foodPlotCam.id, zoneId: northFoodPlot.id, date: '2024-08-15', type: 'FAWN', count: 2, bodyCondition: 'GOOD' },
    { cameraId: beddingCam.id, zoneId: southBedding.id, date: '2024-08-20', type: 'BUCK', count: 1, buckId: kicker.id, antlerClass: 'MEDIUM', bodyCondition: 'GOOD' },
    { cameraId: creekCam.id, zoneId: creekBottom.id, date: '2024-09-01', type: 'DOE', count: 2, bodyCondition: 'EXCELLENT' },
    { cameraId: creekCam.id, zoneId: creekBottom.id, date: '2024-09-05', type: 'BUCK', count: 1, buckId: bigMainframe.id, antlerClass: 'GIANT', bodyCondition: 'EXCELLENT', notes: 'First daylight pic of Big Mainframe this year!' },
    { cameraId: foodPlotCam.id, zoneId: northFoodPlot.id, date: '2024-09-10', type: 'BUCK', count: 1, buckId: splitBrow.id, antlerClass: 'SHOOTER', bodyCondition: 'GOOD' },
    { cameraId: foodPlotCam.id, zoneId: northFoodPlot.id, date: '2024-09-15', type: 'DOE', count: 4, bodyCondition: 'EXCELLENT' },
    { cameraId: beddingCam.id, zoneId: southBedding.id, date: '2024-09-20', type: 'FAWN', count: 1, bodyCondition: 'FAIR' },
    { cameraId: creekCam.id, zoneId: creekBottom.id, date: '2024-10-01', type: 'BUCK', count: 1, buckId: dropTine.id, antlerClass: 'MATURE', bodyCondition: 'EXCELLENT' },
    { cameraId: creekCam.id, zoneId: creekBottom.id, date: '2024-10-05', type: 'DOE', count: 2, bodyCondition: 'GOOD' },
    { cameraId: foodPlotCam.id, zoneId: northFoodPlot.id, date: '2024-10-08', type: 'BUCK', count: 2, antlerClass: 'BASKET', bodyCondition: 'GOOD' },
    { cameraId: beddingCam.id, zoneId: southBedding.id, date: '2024-10-12', type: 'BUCK', count: 1, buckId: tall8.id, antlerClass: 'SHOOTER', bodyCondition: 'EXCELLENT' },
    { cameraId: creekCam.id, zoneId: creekBottom.id, date: '2024-10-20', type: 'DOE', count: 3, bodyCondition: 'GOOD' },
    { cameraId: foodPlotCam.id, zoneId: northFoodPlot.id, date: '2024-10-25', type: 'BUCK', count: 1, buckId: bigMainframe.id, antlerClass: 'GIANT', bodyCondition: 'EXCELLENT', notes: 'Chasing a doe through the food plot at last light.' },
    { cameraId: beddingCam.id, zoneId: southBedding.id, date: '2024-11-01', type: 'BUCK', count: 1, buckId: kicker.id, antlerClass: 'MEDIUM', bodyCondition: 'GOOD' },
    { cameraId: creekCam.id, zoneId: creekBottom.id, date: '2024-11-05', type: 'DOE', count: 1, bodyCondition: 'FAIR' },
    { cameraId: foodPlotCam.id, zoneId: northFoodPlot.id, date: '2024-11-08', type: 'FAWN', count: 2, bodyCondition: 'FAIR' },
    { cameraId: creekCam.id, zoneId: creekBottom.id, date: '2024-11-10', type: 'BUCK', count: 1, buckId: splitBrow.id, antlerClass: 'SHOOTER', bodyCondition: 'GOOD' },
    { cameraId: beddingCam.id, zoneId: southBedding.id, date: '2024-11-15', type: 'UNKNOWN', count: 1, bodyCondition: 'FAIR' },
  ];

  for (const s of sightingData) {
    await prisma.sighting.create({
      data: {
        propertyId: property.id,
        cameraId: s.cameraId,
        zoneId: s.zoneId,
        date: new Date(s.date),
        type: s.type,
        count: s.count,
        buckId: s.buckId || null,
        antlerClass: s.antlerClass || null,
        bodyCondition: s.bodyCondition || null,
        notes: s.notes || null,
      }
    });
  }

  // Land improvements
  await Promise.all([
    prisma.landImprovement.create({ data: { propertyId: property.id, zoneId: northFoodPlot.id, type: 'FOOD_PLOT_PLANT', description: 'Planted fall food plot mix', date: new Date('2024-08-15'), acreage: 8, species: 'Clover, Brassica, Turnips', cost: 320, notes: 'Used Eagle Seed Fall Buffalo Blend' } }),
    prisma.landImprovement.create({ data: { propertyId: property.id, zoneId: northFoodPlot.id, type: 'FERTILIZE', description: 'Applied fertilizer to food plot', date: new Date('2024-07-20'), acreage: 8, cost: 180, notes: '19-19-19 at 200 lbs/acre' } }),
    prisma.landImprovement.create({ data: { propertyId: property.id, zoneId: creekBottom.id, type: 'TIMBER_WORK', description: 'Hinge cut select oaks to improve bedding', date: new Date('2024-03-10'), acreage: 3, cost: 0, notes: 'Created 3 hinge-cut funnels toward stand locations' } }),
    prisma.landImprovement.create({ data: { propertyId: property.id, type: 'WATER_SOURCE', description: 'Installed wildlife water tank', date: new Date('2024-05-15'), cost: 450, notes: 'Stock tank with float valve. Located near south bedding.' } }),
    prisma.landImprovement.create({ data: { propertyId: property.id, zoneId: southBedding.id, type: 'BRUSH_CLEARING', description: 'Cleared invasive brush from bedding edges', date: new Date('2024-04-01'), acreage: 2, cost: 0, notes: 'Cut multiflora rose and honeysuckle. Opened edge habitat.' } }),
  ]);

  // Soil test
  await prisma.soilTest.create({ data: { propertyId: property.id, zoneId: northFoodPlot.id, date: new Date('2024-06-01'), ph: 6.2, nitrogen: 45, phosphorus: 38, potassium: 180, notes: 'Pre-planting test. pH slightly low, applied lime in July.' } });

  // Harvests
  await prisma.harvest.create({ data: { propertyId: property.id, zoneId: eastStand.id, date: new Date('2024-11-01'), type: 'DOE', weight: 85, ageEstimate: 2, notes: 'Doe management harvest. Good body condition.' } });

  await prisma.harvest.create({ data: { propertyId: property.id, buckId: kicker.id, zoneId: eastStand.id, date: new Date('2024-11-10'), type: 'BUCK', weight: 165, ageEstimate: 3, mainBeams: 19.5, spread: 18, points: 8, notes: 'Great 3.5 year old buck. Let him walk last year.' } });
  await prisma.buck.update({ where: { id: kicker.id }, data: { harvested: true, harvestedAt: new Date('2024-11-10') } });

  console.log('✅ Seed complete!');
  console.log('   User: hunter@deertrack.app / Hunt1234!');
  console.log(`   Property: Brody's Farm (${property.id})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
