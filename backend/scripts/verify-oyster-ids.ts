/**
 * Verify Oyster IDs Script
 * 
 * Checks if oyster IDs match between list and detail endpoints
 */

import dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

import prisma from '../src/lib/prisma';

async function verifyOysterIds() {
  try {
    console.log('🔍 Verifying oyster IDs...\n');

    // Get all oysters sorted by name (like the list endpoint)
    const allOysters = await prisma.oyster.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    console.log(`📊 Total oysters: ${allOysters.length}\n`);

    // Find Bahia Falsa and Naked Cowboy
    const bahiaFalsa = allOysters.find(o => 
      o.name.toLowerCase().includes('bahia') && 
      o.name.toLowerCase().includes('falsa')
    );
    
    const nakedCowboy = allOysters.find(o => 
      o.name.toLowerCase().includes('naked') && 
      o.name.toLowerCase().includes('cowboy')
    );

    if (bahiaFalsa) {
      console.log(`✅ Bahia Falsa:`);
      console.log(`   ID: ${bahiaFalsa.id}`);
      console.log(`   Name: ${bahiaFalsa.name}`);
      
      // Check if we can fetch it by ID
      const byId = await prisma.oyster.findUnique({
        where: { id: bahiaFalsa.id },
        select: { id: true, name: true },
      });
      
      if (byId && byId.name === bahiaFalsa.name) {
        console.log(`   ✅ ID lookup works correctly\n`);
      } else {
        console.log(`   ❌ ID lookup failed! Got: ${byId?.name || 'null'}\n`);
      }
    } else {
      console.log(`❌ Bahia Falsa not found\n`);
    }

    if (nakedCowboy) {
      console.log(`✅ Naked Cowboy:`);
      console.log(`   ID: ${nakedCowboy.id}`);
      console.log(`   Name: ${nakedCowboy.name}\n`);
    } else {
      console.log(`❌ Naked Cowboy not found\n`);
    }

    // Check alphabetical position
    if (bahiaFalsa && nakedCowboy) {
      const bahiaIndex = allOysters.findIndex(o => o.id === bahiaFalsa.id);
      const nakedIndex = allOysters.findIndex(o => o.id === nakedCowboy.id);
      
      console.log(`📍 Alphabetical positions:`);
      console.log(`   Bahia Falsa: Position ${bahiaIndex + 1}`);
      console.log(`   Naked Cowboy: Position ${nakedIndex + 1}\n`);
      
      // Check if numeric ID lookup would cause issues
      console.log(`⚠️  Testing numeric ID lookup (if ID were numeric):`);
      if (!isNaN(parseInt(bahiaFalsa.id, 10))) {
        const numericId = parseInt(bahiaFalsa.id, 10);
        const byNumeric = await prisma.oyster.findMany({
          orderBy: { name: 'asc' },
          skip: numericId - 1,
          take: 1,
        });
        console.log(`   If Bahia Falsa ID (${bahiaFalsa.id}) were numeric ${numericId}, would return: ${byNumeric[0]?.name || 'null'}`);
      } else {
        console.log(`   Bahia Falsa ID is UUID (not numeric) - numeric lookup won't apply`);
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error verifying oyster IDs:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifyOysterIds();

