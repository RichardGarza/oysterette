#!/bin/bash
# Migration script for production database
# Run this manually on Railway: railway run bash scripts/migrate-production.sh

echo "Running production migrations..."
npx prisma migrate deploy

echo "Migration complete!"

