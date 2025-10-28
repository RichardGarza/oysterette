import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import prisma from './lib/prisma';

dotenv.config();

interface OysterDataJSON {
  name: string;
  species: string;
  origin: string;
  standout_note?: string;
  size: number;
  body: number;
  sweet_brininess: number;
  flavorfulness: number;
  creaminess: number;
}

async function seedDatabase() {
  try {
    console.log('🌊 Starting Oysterette database seeding...\n');

    // Read oyster data from JSON file
    const dataPath = path.join(__dirname, '../data/oyster-list-for-seeding.json');

    if (!fs.existsSync(dataPath)) {
      console.error('❌ Error: oyster-list-for-seeding.json not found at:', dataPath);
      console.log('📝 Please place your oyster JSON file at:', dataPath);
      process.exit(1);
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const oysters: OysterDataJSON[] = JSON.parse(rawData);

    console.log(`📖 Loaded ${oysters.length} oysters from JSON file`);

    // Clear existing oysters
    const deleted = await prisma.oyster.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.count} existing oysters\n`);

    // Insert oysters
    let successCount = 0;
    let errorCount = 0;

    for (const oyster of oysters) {
      try {
        await prisma.oyster.create({
          data: {
            name: oyster.name,
            species: oyster.species,
            origin: oyster.origin,
            standoutNotes: oyster.standout_note || null,
            size: oyster.size || 5,
            body: oyster.body || 5,
            sweetBrininess: oyster.sweet_brininess || 5,
            flavorfulness: oyster.flavorfulness || 5,
            creaminess: oyster.creaminess || 5,
          },
        });
        successCount++;
        console.log(`  ✓ ${oyster.name}`);
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Failed to add ${oyster.name}:`, error);
      }
    }

    console.log(`\n✅ Database seeding completed!`);
    console.log(`   Success: ${successCount} oysters`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount} oysters`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedDatabase();
