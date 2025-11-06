# Build Optimization Guide for Oysterette

## Overview

This guide covers strategies to reduce build sizes, improve build speed, and maintain code quality through automated workflows.

---

## Quick Start: Pre-Build Workflow

Before each build, run the automated pre-build script:

```bash
# From project root
./pre-build.sh [mobile|backend|all]

# Examples:
./pre-build.sh mobile    # Check mobile app only
./pre-build.sh backend   # Check backend only
./pre-build.sh all       # Check everything (default)
```

The script will:
1. ✅ Run depcheck to find unused dependencies
2. ✅ Run tests (backend)
3. ✅ Check git status and prompt for commit
4. ✅ Show next steps for building

---

## Dependency Management with Depcheck

### What is Depcheck?

Depcheck analyzes your `package.json` and identifies:
- Unused dependencies (can be removed)
- Missing dependencies (should be added)
- Unused dev dependencies

### Running Depcheck Manually

**Backend:**
```bash
cd backend
npm run depcheck
```

**Mobile App:**
```bash
cd mobile-app
npm run depcheck
```

### Understanding Results

**Example output:**
```
Unused dependencies
* expo-auth-session
* expo-crypto
* react-dom
```

**Action:** Review each package:
1. **Verify** it's truly unused (check imports)
2. **Remove** if confirmed unused:
   ```bash
   npm uninstall expo-auth-session expo-crypto react-dom
   ```
3. **Re-run** depcheck to confirm

**Common False Positives** (already ignored in our config):
- `pg` (used by Prisma)
- `prisma` (CLI tool)
- `react-native-safe-area-context` (used by React Navigation)
- `react-native-screens` (used by React Navigation)
- `expo-updates` (required for OTA updates)

---

## Build Size Optimization

### Current Build Sizes
- **Mobile APK:** ~70MB (unoptimized) → Target: 20-30MB
- **Backend Bundle:** Varies based on dependencies

### 1. Remove Unused Dependencies

**Packages We Can Remove:**
```bash
cd mobile-app
npm uninstall expo-auth-session expo-crypto expo-web-browser react-dom react-native-web
```

**Expected Savings:** 5-10MB

### 2. Optimize Assets

**Images:**
- Compress with [TinyPNG](https://tinypng.com) or ImageOptim
- Use responsive loading with `expo-image`
- Load large assets from CDN instead of bundling

**Fonts:**
- Subset fonts to only used characters
- Remove unused font weights

**Example:**
```bash
# Before optimization
assets/logo.png: 2.5MB

# After TinyPNG compression
assets/logo.png: 400KB
```

### 3. Enable ProGuard (Android)

Already configured in `app.json`:
```json
{
  "expo": {
    "android": {
      "enableProguardInReleaseBuilds": true
    }
  }
}
```

**What it does:**
- Minifies Java/Kotlin code
- Removes unused code
- Obfuscates class names

**Expected Savings:** 10-20MB

### 4. Enable Hermes Engine

Already enabled in `app.json`:
```json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

**Benefits:**
- Faster startup time
- Smaller JS bundle
- Lower memory usage

**Expected Savings:** 5-10MB

### 5. Split APKs by Architecture

**Current:** Universal APK (all architectures)
**Optimized:** Separate APKs per architecture

**To enable:** Update `eas.json`:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease",
        "splits": {
          "abi": true
        }
      }
    }
  }
}
```

**Expected Savings:** 30-40% per architecture-specific APK

### 6. Code Splitting & Lazy Loading

**Implement in screens:**
```typescript
// Before
import HeavyScreen from './screens/HeavyScreen';

// After (lazy load)
const HeavyScreen = React.lazy(() => import('./screens/HeavyScreen'));
```

**Expected Savings:** Reduces initial bundle size

---

## Bundle Analysis

### Analyze Bundle Contents

**For Mobile App:**
```bash
cd mobile-app
npx expo-bundle-visualizer
```

**For Backend:**
```bash
cd backend
npm run build
du -sh dist/*
```

**What to look for:**
- Large packages (>500KB)
- Duplicate dependencies
- Unused code in bundle

---

## Performance Optimizations

### 1. Memoization

**Before:**
```typescript
function ExpensiveComponent({ data }) {
  const processed = processData(data); // Runs every render
  return <View>...
```

**After:**
```typescript
function ExpensiveComponent({ data }) {
  const processed = useMemo(() => processData(data), [data]);
  return <View>...
```

### 2. Callback Optimization

```typescript
// Use useCallback for event handlers
const handlePress = useCallback(() => {
  // handler logic
}, [dependencies]);
```

### 3. Image Optimization

```typescript
// Use optimized Image component
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

---

## Build Speed Improvements

### 1. Use EAS Build (Cloud)

**Faster than local builds:**
```bash
# Cloud build (5-10 min)
eas build --platform android --profile preview

# Local build (20-30 min)
npm run build:android:local
```

### 2. Enable Caching

**For npm:**
```bash
# Use npm ci for faster installs
npm ci
```

**For Yarn:**
```bash
# Enable zero-installs
yarn --frozen-lockfile
```

### 3. Parallelize CI/CD

**GitHub Actions example:**
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20]
    steps:
      - run: npm ci
      - run: npm test
```

---

## Recommended Workflow

### Before Each Build:

1. **Run Pre-Build Script:**
   ```bash
   ./pre-build.sh all
   ```

2. **Review Depcheck Results:**
   - Remove unused dependencies
   - Verify changes work locally

3. **Run Tests:**
   ```bash
   cd backend && npm test
   ```

4. **Commit Changes:**
   ```bash
   git add .
   git commit -m "chore: remove unused dependencies"
   ```

5. **Build:**
   ```bash
   # Mobile OTA update (fast)
   cd mobile-app
   npm run deploy-update "Remove unused dependencies"

   # Mobile APK build (slow, only when needed)
   eas build --platform android --profile preview

   # Backend (auto-deploys via Railway)
   git push origin main
   ```

---

## Monitoring & Metrics

### Track Build Sizes Over Time

```bash
# After each build, record size
ls -lh mobile-app/build/*.apk

# Example log:
# v1.0.0: 68.5 MB
# v1.0.1: 52.3 MB (-23%)
# v1.0.2: 31.8 MB (-46%)
```

### Performance Monitoring

**Use Expo's built-in profiler:**
```typescript
import { PerformanceObserver } from 'react-native';

const observer = new PerformanceObserver((list) => {
  console.log('Performance:', list.getEntries());
});
observer.observe({ entryTypes: ['measure'] });
```

---

## Common Issues & Solutions

### Issue: "Depcheck reports false positives"

**Solution:** Add to ignore list in `package.json`:
```json
{
  "scripts": {
    "depcheck": "depcheck --ignores='package-name'"
  }
}
```

### Issue: "Build size still large after optimization"

**Solutions:**
1. Run bundle analyzer to find culprits
2. Check for large assets in `/assets`
3. Verify ProGuard is enabled
4. Split by architecture

### Issue: "Tests fail during prebuild"

**Solution:**
1. Fix failing tests first
2. Run tests locally: `npm test`
3. Don't skip tests - they catch bugs!

---

## Advanced Optimizations

### 1. Metro Bundler Configuration

**Create/update `metro.config.js`:**
```javascript
module.exports = {
  transformer: {
    minifierConfig: {
      compress: {
        drop_console: true, // Remove console.logs in production
      },
    },
  },
};
```

### 2. Tree Shaking

**Ensure proper imports:**
```typescript
// ✅ Good - tree-shakeable
import { debounce } from 'lodash-es';

// ❌ Bad - imports entire library
import _ from 'lodash';
```

### 3. Dynamic Imports

```typescript
// Load heavy libraries only when needed
const pdfGenerator = async () => {
  const pdf = await import('react-native-pdf');
  return pdf.generate();
};
```

---

## NPM Scripts Reference

### Backend Scripts
```bash
npm run depcheck           # Check for unused dependencies
npm run test               # Run all tests
npm run test:integration   # Run integration tests only
npm run prebuild           # Run depcheck + tests
npm run build:prod         # Run prebuild + build
```

### Mobile App Scripts
```bash
npm run depcheck           # Check for unused dependencies
npm run build:android      # Build APK (without checks)
npm run build:android:prod # Run depcheck + build APK
npm run deploy-update      # Deploy OTA update
```

### Root Scripts
```bash
./pre-build.sh mobile      # Full pre-build for mobile
./pre-build.sh backend     # Full pre-build for backend
./pre-build.sh all         # Full pre-build for everything
```

---

## Resources

- [Expo Bundle Sizes](https://docs.expo.dev/guides/analyzing-bundle-size/)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [EAS Build Configuration](https://docs.expo.dev/build/introduction/)
- [Depcheck Documentation](https://github.com/depcheck/depcheck)
- [Metro Bundler](https://facebook.github.io/metro/)

---

## Summary

**Key Takeaways:**
1. ✅ Always run `./pre-build.sh` before building
2. ✅ Remove unused dependencies regularly
3. ✅ Compress assets before adding to project
4. ✅ Use OTA updates for quick iterations
5. ✅ Build new APKs only when necessary
6. ✅ Monitor build sizes over time

**Expected Results:**
- **30-50% smaller** APK sizes
- **2-3x faster** build times
- **Fewer bugs** (via automated testing)
- **Better performance** (less bloat)

---

*Last updated: January 2025*
