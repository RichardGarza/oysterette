import prisma from '../lib/prisma';
import { recalculateOysterRatings } from '../services/ratingService';

async function recalculateAllRatings() {
  try {
    console.log('🔄 Recalculating all oyster ratings...');

    const oysters = await prisma.oyster.findMany({
      select: { id: true, name: true },
    });

    console.log(`Found ${oysters.length} oysters`);

    for (const oyster of oysters) {
      await recalculateOysterRatings(oyster.id);
      process.stdout.write('.');
    }

    console.log('\n✅ All ratings recalculated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error recalculating ratings:', error);
    process.exit(1);
  }
}

recalculateAllRatings();
