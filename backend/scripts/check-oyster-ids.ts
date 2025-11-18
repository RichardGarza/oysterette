/**
 * Check Oyster IDs Script
 * 
 * Investigates why some oysters show in the list but aren't found by ID.
 * Checks for:
 * - Oysters in the list that can't be found by ID
 * - ID format issues
 * - Case sensitivity issues
 */

import dotenv from 'dotenv';
import prisma from '../src/lib/prisma';

dotenv.config();

async function checkOysterIds() {
  try {
    console.log('🔍 Checking oyster IDs...\n');

    // Get all oysters from database
    const allOysters = await prisma.oyster.findMany({
      select: {
        id: true,
        name: true,
        totalReviews: true,
        overallScore: true,
      },
      orderBy: { name: 'asc' },
    });

    console.log(`📊 Total oysters in database: ${allOysters.length}\n`);

    // Check for "Bahia Falsa" specifically
    const bahiaFalsa = allOysters.find(o => 
      o.name.toLowerCase().includes('bahia') && 
      o.name.toLowerCase().includes('falsa')
    );

    if (bahiaFalsa) {
      console.log(`✅ Found "Bahia Falsa":`);
      console.log(`   ID: ${bahiaFalsa.id}`);
      console.log(`   Name: ${bahiaFalsa.name}`);
      console.log(`   Total Reviews: ${bahiaFalsa.totalReviews}`);
      console.log(`   Overall Score: ${bahiaFalsa.overallScore}\n`);
    } else {
      console.log(`❌ "Bahia Falsa" NOT found in database\n`);
    }

    // Check for ID format issues
    const invalidIds = allOysters.filter(o => {
      // UUID should be 36 characters with dashes
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return !uuidRegex.test(o.id);
    });

    if (invalidIds.length > 0) {
      console.log(`⚠️  Found ${invalidIds.length} oysters with invalid ID format:`);
      invalidIds.forEach(o => {
        console.log(`   - ${o.name}: ${o.id}`);
      });
      console.log();
    }

    // Check for duplicates
    const nameMap = new Map<string, string[]>();
    allOysters.forEach(o => {
      const key = o.name.toLowerCase();
      if (!nameMap.has(key)) {
        nameMap.set(key, []);
      }
      nameMap.get(key)!.push(o.id);
    });

    const duplicates = Array.from(nameMap.entries()).filter(([_, ids]) => ids.length > 1);
    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate names:`);
      duplicates.forEach(([name, ids]) => {
        console.log(`   - "${name}": ${ids.length} entries`);
        ids.forEach(id => console.log(`     ID: ${id}`));
      });
      console.log();
    }

    // Check for oysters with null/zero ratings that should have them
    const oystersNeedingRatings = allOysters.filter(o => 
      o.totalReviews === 0 && o.overallScore === 5
    );
    
    console.log(`📈 Oysters needing rating recalculation: ${oystersNeedingRatings.length}`);
    if (oystersNeedingRatings.length > 0 && oystersNeedingRatings.length <= 10) {
      oystersNeedingRatings.forEach(o => {
        console.log(`   - ${o.name} (ID: ${o.id})`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error checking oyster IDs:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkOysterIds();

