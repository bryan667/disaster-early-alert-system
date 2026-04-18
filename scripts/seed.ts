import { randomUUID } from 'node:crypto';
import { getPrisma } from '@/lib/db';

const HOTSPOTS = [
  { city: 'Muntinlupa', barangays: ['Alabang', 'Ayala Alabang', 'Cupang'] },
  { city: 'Baguio', barangays: ['Irisan', 'Pacdal', 'Loakan Proper'] },
  { city: 'Angeles', barangays: ['Balibago', 'Malabanias', 'Sapu-biato'] },
  {
    city: 'Batangas City',
    barangays: ['Pallocan West', 'Kumintang Ibaba', 'Libjo'],
  },
  { city: 'Antipolo', barangays: ['San Roque', 'Dela Paz', 'Mambugan'] },
  { city: 'Dagupan', barangays: ['Bonuan Gueset', 'Pantal', 'Lucao'] },
  { city: 'Legazpi', barangays: ['Bitano', 'Rawis', 'Tiburcio Tandaay'] },
  { city: 'San Fernando', barangays: ['Sindalan', 'Dolores', 'Calulut'] },
  {
    city: 'Las Piñas',
    barangays: ['Pamplona Dos', 'BF International Village', 'Pulang Lupa Dos'],
  },
  { city: 'Lipa', barangays: ['Marawoy', 'Sabang', 'Mataas Na Lupa'] },
  {
    city: 'Tuguegarao',
    barangays: ['Cataggaman Nuevo', 'Ugac Sur', 'Caritan Norte'],
  },
  {
    city: 'Tagaytay',
    barangays: ['Mendez Crossing West', 'Iruhin East', 'Silang Junction South'],
  },
  {
    city: 'Quezon City',
    barangays: ['Batasan Hills', 'Bagong Silangan', 'Commonwealth'],
  },
  { city: 'Manila', barangays: ['Tondo', 'Ermita', 'Sampaloc'] },
  { city: 'Makati', barangays: ['Poblacion', 'Bel-Air', 'Bangkal'] },
  {
    city: 'Imus',
    barangays: ['Alapan I-A', 'Bucandala III', 'Malagasang I-G'],
  },
  { city: 'Bacoor', barangays: ['Molino III', 'Talaba V', 'Salinas I'] },
  { city: 'Naga', barangays: ['Concepcion Grande', 'Pacol', 'Sabang'] },
] as const;

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

async function main() {
  const prisma = getPrisma();

  await prisma.processedFeedItem.deleteMany();
  await prisma.disasterEvent.deleteMany();
  await prisma.policyholder.deleteMany();

  const totalRecords = 10000;
  const batchSize = 500;

  for (let start = 0; start < totalRecords; start += batchSize) {
    const data = [];
    const end = Math.min(start + batchSize, totalRecords);

    for (let index = start; index < end; index += 1) {
      const hotspot = pickRandom(HOTSPOTS);
      const barangay = pickRandom(hotspot.barangays);
      const fullName = `Policyholder ${index + 1}`;
      const email = `policyholder${index + 1}@example.com`;
      const policyType = index % 2 === 0 ? 'Property' : 'Motor';
      const premiumAmount = (2000 + (index % 250) * 19.75).toFixed(2);

      data.push({
        id: randomUUID(),
        fullName,
        email,
        city: hotspot.city,
        barangay,
        policyType,
        premiumAmount,
      });
    }

    await prisma.policyholder.createMany({
      data,
    });
  }

  console.log('Seeded 10,000 mock policyholders.');
  await prisma.$disconnect();
}

main().catch(async (error) => {
  const prisma = getPrisma();
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
