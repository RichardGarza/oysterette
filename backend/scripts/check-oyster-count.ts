import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOysterCount() {
  try {
    const count = await prisma.oyster.count();
    console.log(`\n📊 Total oysters in database: ${count}`);

    // Get some details
    const oysters = await prisma.oyster.findMany({
      select: {
        name: true,
        species: true,
        origin: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Check for duplicates
    const names = oysters.map(o => o.name);
    const uniqueNames = new Set(names);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

    console.log(`\n📋 Unique oyster names: ${uniqueNames.size}`);

    if (duplicates.length > 0) {
      console.log(`\n⚠️  Found ${duplicates.length} duplicate names:`);
      const uniqueDuplicates = [...new Set(duplicates)];
      uniqueDuplicates.forEach(name => {
        const count = names.filter(n => n === name).length;
        console.log(`  - "${name}" appears ${count} times`);
      });
    } else {
      console.log(`\n✅ No duplicate names found`);
    }

    // Check species distribution
    const speciesCount = oysters.reduce((acc, o) => {
      acc[o.species] = (acc[o.species] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n🧬 Species distribution:`);
    Object.entries(speciesCount).forEach(([species, count]) => {
      console.log(`  - ${species}: ${count}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOysterCount();
