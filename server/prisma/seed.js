const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // ── Clear existing data (FK-safe order) ──────────────────────────────────
  await prisma.notification.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data.');

  // ── Seed owner ───────────────────────────────────────────────────────────
  const owner = await prisma.user.create({
    data: {
      name: 'Marco Rossi',
      email: 'marco.rossi@walkup.dev',
      password_hash: 'hashed_password_placeholder',
      phone: '+14155550101',
      role: 'RESTAURANT_OWNER',
    },
  });

  console.log(`Created owner: ${owner.name} (${owner.id})`);

  // ── Seed restaurants ─────────────────────────────────────────────────────
  const restaurants = await Promise.all([
    prisma.restaurant.create({
      data: {
        owner_id: owner.id,
        name: "Trattoria da Marco",
        address: "512 Columbus Ave, San Francisco, CA 94133",
        phone: '+14155550201',
        latitude: 37.8003,
        longitude: -122.4089,
        cuisine_type: 'Italian',
        avg_seating_minutes: 35,
        max_capacity: 50,
        is_waitlist_open: true,
      },
    }),
    prisma.restaurant.create({
      data: {
        owner_id: owner.id,
        name: "El Rancho Cantina",
        address: "2288 Mission St, San Francisco, CA 94110",
        phone: '+14155550202',
        latitude: 37.7601,
        longitude: -122.4189,
        cuisine_type: 'Mexican',
        avg_seating_minutes: 25,
        max_capacity: 40,
        is_waitlist_open: true,
      },
    }),
    prisma.restaurant.create({
      data: {
        owner_id: owner.id,
        name: "Sakura Omakase",
        address: "1737 Post St, San Francisco, CA 94115",
        phone: '+14155550203',
        latitude: 37.7850,
        longitude: -122.4312,
        cuisine_type: 'Japanese',
        avg_seating_minutes: 40,
        max_capacity: 30,
        is_waitlist_open: false,
      },
    }),
    prisma.restaurant.create({
      data: {
        owner_id: owner.id,
        name: "The Golden Griddle",
        address: "401 Castro St, San Francisco, CA 94114",
        phone: '+14155550204',
        latitude: 37.7609,
        longitude: -122.4350,
        cuisine_type: 'American',
        avg_seating_minutes: 20,
        max_capacity: 60,
        is_waitlist_open: false,
      },
    }),
  ]);

  for (const r of restaurants) {
    console.log(`Created restaurant: ${r.name} (waitlist open: ${r.is_waitlist_open})`);
  }

  console.log('\nSeed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
