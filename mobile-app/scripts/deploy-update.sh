#!/bin/bash

# Oysterette Deployment Script
# Publishes OTA updates to users without requiring new APK builds

set -e  # Exit on error

echo "🚀 Oysterette Update Deployment"
echo "================================"
echo ""

# Check if we're in the mobile-app directory
if [ ! -f "app.json" ]; then
  echo "❌ Error: Must run from mobile-app directory"
  exit 1
fi

# Get update message from argument or prompt
if [ -z "$1" ]; then
  echo "📝 Enter update description:"
  read -r UPDATE_MESSAGE
else
  UPDATE_MESSAGE="$1"
fi

echo ""
echo "📦 Publishing update: $UPDATE_MESSAGE"
echo ""

# Publish to preview channel (for testing with friends)
echo "📤 Publishing to preview channel..."
eas update --branch preview --message "$UPDATE_MESSAGE"

echo ""
echo "✅ Update published successfully!"
echo ""
echo "📱 Your friends will get this update automatically"
echo "   when they open the app (or within a few minutes)"
echo ""
echo "🔍 View update status: https://expo.dev/accounts/rgactr/projects/oysterette/updates"
echo ""
