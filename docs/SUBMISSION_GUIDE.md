# App Store Submission Guide for Oysterette

**Complete Step-by-Step Instructions**
**Last Updated:** November 7, 2025

---

## Overview

This guide walks you through submitting Oysterette to both the Apple App Store and Google Play Store. Follow the steps in order for a smooth submission process.

**Estimated Time:**
- Apple App Store: 3-4 hours
- Google Play Store: 2-3 hours
- Total: 5-7 hours (excluding review time)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] Apple Developer Account ($99/year) - [Sign up](https://developer.apple.com/programs/)
- [ ] Google Play Console Account ($25 one-time) - [Sign up](https://play.google.com/console/signup)
- [ ] Privacy Policy hosted at public URL
- [ ] Terms of Service hosted at public URL
- [ ] Screenshots captured (see SCREENSHOT_SPECIFICATIONS.md)
- [ ] App icon (1024x1024 for Apple, 512x512 for Google)
- [ ] Production builds ready (see "Building for Production" section)
- [ ] Support email active

---

## Part 1: Building for Production

### Step 1.1: Prepare Production Environment

```bash
cd /Users/garzamacbookair/projects/claude-project/mobile-app

# Ensure EAS CLI is installed
npm install -g eas-cli

# Login to Expo account
eas login

# Verify project configuration
eas build:configure
```

### Step 1.2: Build for iOS

```bash
# Generate iOS production build
eas build --platform ios --profile production

# This will:
# - Create IPA file for App Store
# - Handle code signing automatically
# - Upload to EAS servers
# - Take 15-30 minutes

# Note the build ID when complete
```

**Build Profile (already configured in eas.json):**
```json
{
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release",
        "distribution": "store"
      }
    }
  }
}
```

### Step 1.3: Build for Android

```bash
# Generate Android production build
eas build --platform android --profile production

# This will:
# - Create AAB bundle for Play Store
# - Handle signing automatically
# - Upload to EAS servers
# - Take 10-20 minutes

# Note the build ID when complete
```

### Step 1.4: Download Builds

```bash
# Download iOS build
eas build:download --platform ios --buildId [YOUR_BUILD_ID]

# Download Android build
eas build:download --platform android --buildId [YOUR_BUILD_ID]
```

Or download from: https://expo.dev/accounts/[YOUR_ACCOUNT]/projects/oysterette/builds

---

## Part 2: Apple App Store Submission

### Step 2.1: Access App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Click **"My Apps"**
4. Click the **"+"** button → **"New App"**

### Step 2.2: Create New App

**Fill in the following:**

1. **Platforms:** iOS
2. **Name:** Oysterette
3. **Primary Language:** English (U.S.)
4. **Bundle ID:** Select the bundle ID from dropdown (created by EAS)
5. **SKU:** oysterette-ios-2025 (unique identifier, your choice)
6. **User Access:** Full Access

Click **"Create"**

### Step 2.3: Fill App Information

Navigate to **App Information** section:

**Category:**
- Primary: Food & Drink
- Secondary: Lifestyle

**Age Rating:**
- Click **"Edit"**
- Answer questionnaire (all "No" except basic features)
- Expected Rating: 4+

**Privacy Policy URL:**
```
[YOUR_PRIVACY_POLICY_URL]
```

**Support URL:**
```
[YOUR_SUPPORT_URL]
```

**Marketing URL (Optional):**
```
[YOUR_WEBSITE_URL]
```

Click **"Save"**

### Step 2.4: Pricing and Availability

1. **Price:** Free
2. **Availability:** All territories (or select specific countries)
3. **Pre-order:** No

Click **"Save"**

### Step 2.5: Prepare for Submission

Navigate to **"Prepare for Submission"** or create a new version:

**Version Information:**
```
Version: 1.0.0
Copyright: 2025 [YOUR NAME/COMPANY]
```

### Step 2.6: App Store Listing

**Promotional Text (170 chars, editable without review):**
```
🦪 Discover the perfect oyster! Browse 838+ varieties, read detailed reviews, and track your favorites. Join the ultimate oyster community today!
```

**Description (4000 chars):**
Copy from `docs/APP_STORE_METADATA.md` → Long Description section

**Keywords (100 chars):**
```
oyster, seafood, restaurant, review, rating, food, dining, culinary, gourmet, shellfish
```

**Support URL:**
```
[YOUR_SUPPORT_URL]
```

**Marketing URL (Optional):**
```
[YOUR_WEBSITE_URL]
```

### Step 2.7: What's New in This Version

```
🎉 Welcome to Oysterette!

Oysterette is finally here! Discover, review, and track oysters like never before.

✨ Launch Features:
• Browse 838+ oyster varieties
• Detailed 10-point attribute ratings
• Community-driven reviews and ratings
• Favorite oysters with cross-device sync
• Top Oysters leaderboard
• Beautiful dark mode
• Google Sign-In support
• Advanced search and filters
• Personalized user profiles

Thank you for being part of our launch!
```

### Step 2.8: Upload Screenshots

1. Click **"App Previews and Screenshots"**
2. Select **"6.7" Display"** (iPhone 15 Pro Max)
3. Click **"+"** to upload screenshots
4. Upload 3-6 screenshots in order (user journey)
5. Add captions if desired (optional)

**If you have iPad screenshots:**
- Select **"12.9" Display"** (iPad Pro)
- Upload iPad screenshots

### Step 2.9: Build

1. Click **"Build"** section
2. If build doesn't appear, upload manually:
   - Use Transporter app (Mac App Store)
   - Or use: `eas submit --platform ios`
3. Select your build from the list
4. Wait for processing (5-30 minutes)

### Step 2.10: App Review Information

**Contact Information:**
```
First Name: [YOUR FIRST NAME]
Last Name: [YOUR LAST NAME]
Phone: [YOUR PHONE NUMBER]
Email: [YOUR SUPPORT EMAIL]
```

**Demo Account (if applicable):**
- Username: Not required (app works without login)
- Password: N/A
- Note: "App allows browsing without account. Account creation available in-app."

**Notes:**
```
Thank you for reviewing Oysterette!

This app helps oyster enthusiasts discover, review, and track oysters. All features are functional and ready for review.

Test Account (optional):
Email: test@oysterette.com
Password: TestPass123!

Key features to test:
1. Browse oysters without account
2. Create account or sign in with Google
3. Add review with sliders
4. Vote on reviews (agree/disagree)
5. View Top Oysters leaderboard
6. Check profile with stats

No special configuration needed. App connects to production backend.
```

**Attachments:**
- Add screenshots of key features if needed
- Include demo video if available

### Step 2.11: Version Release

**Release Options:**
- **Manually release this version** (Recommended for first release)
- Auto release after approval (for future updates)

### Step 2.12: Export Compliance

**Is your app exempt from encryption regulations?**
- Select **"Yes"** (uses standard HTTPS only)

**Or:**
- Uses encryption: Yes
- Uses standard encryption: Yes
- Qualifies for exemption: Yes

### Step 2.13: Advertising Identifier (IDFA)

**Does this app use the Advertising Identifier (IDFA)?**
- Select **"No"** (we don't use advertising)

### Step 2.14: Content Rights

**Do you have the necessary rights?**
- Select **"Yes"**

### Step 2.15: Submit for Review

1. Review all information carefully
2. Click **"Add for Review"**
3. Click **"Submit to App Review"**
4. Confirm submission

**Status will change to:**
- "Waiting for Review" → "In Review" → "Pending Developer Release" or "Ready for Sale"

**Review Timeline:** Typically 24-48 hours

---

## Part 3: Google Play Store Submission

### Step 3.1: Access Google Play Console

1. Go to https://play.google.com/console
2. Sign in with your Google account
3. Click **"Create app"**

### Step 3.2: Create New App

**Fill in the following:**

1. **App name:** Oysterette
2. **Default language:** English (United States)
3. **App or game:** App
4. **Free or paid:** Free
5. **Declarations:**
   - [ ] Developer Program Policies
   - [ ] US export laws

Click **"Create app"**

### Step 3.3: Set Up Your App

You'll see a checklist on the left. Complete each section:

---

#### 3.3.1 Store Settings → App Access

**Is your app restricted?**
- No, my app doesn't require special access

**Or if requiring account:**
- All or some features require login
- Provide demo credentials:
  ```
  Email: test@oysterette.com
  Password: TestPass123!
  ```

Click **"Save"**

---

#### 3.3.2 Store Settings → Ads

**Does your app contain ads?**
- No

Click **"Save"**

---

#### 3.3.3 Store Settings → Content Rating

1. Click **"Start questionnaire"**
2. **Email:** [YOUR EMAIL]
3. **App category:** Social, Communication, User Generated Content, or Education

**Questionnaire (answer these):**
- Violence: No
- Sexuality: No
- Language: No
- Controlled Substances: No (food content only)
- User interaction features: Yes
  - Users can interact: Yes (reviews, voting)
  - Users can share info: Yes (reviews are public)
  - Users can share location: No

4. Click **"Save"** then **"Submit"**
5. Ratings generated automatically for all regions

**Expected Rating:** PEGI 3 / ESRB Everyone

---

#### 3.3.4 Store Settings → Target Audience

**Age groups:**
- Select: 18 and over (primary audience)
- Select: 13-17 (secondary, optional)

**Store Presence:**
- Should be listed in family-friendly apps: No

Click **"Next"** then **"Save"**

---

#### 3.3.5 Store Settings → News Apps

**Is this a news app?**
- No

Click **"Save"**

---

#### 3.3.6 Store Settings → COVID-19 Contact Tracing

**Is this a COVID-19 contact tracing or status app?**
- No

Click **"Save"**

---

#### 3.3.7 Store Settings → Data Safety

**This is critical—use docs/DATA_SAFETY_DISCLOSURE.md as reference**

1. **Does your app collect or share data?**
   - Yes

2. **Data types collected:**

**Personal Info:**
- Email address: Collected, Required, Not ephemeral
  - Purpose: Account management, App functionality
  - Shared: No

- Name: Collected, Required, Not ephemeral
  - Purpose: Account management, App functionality
  - Shared: No

- User IDs: Collected, Required, Not ephemeral
  - Purpose: Account management, App functionality
  - Shared: No

**App Activity:**
- App interactions: Collected, Optional, Not ephemeral
  - Purpose: App functionality, Analytics
  - Shared: No

**App Info and Performance:**
- Crash logs: Collected, Optional, Ephemeral
  - Purpose: App functionality
  - Shared: No

- Diagnostics: Collected, Optional, Ephemeral
  - Purpose: App functionality, Analytics
  - Shared: No

**Device or Other IDs:**
- Device IDs: Collected, Optional, Not ephemeral
  - Purpose: App functionality, Analytics
  - Shared: No

3. **Is data encrypted in transit?**
   - Yes

4. **Can users request data deletion?**
   - Yes

5. **Privacy Policy:**
```
[YOUR_PRIVACY_POLICY_URL]
```

Click **"Save"**

---

#### 3.3.8 Store Settings → Government Apps

**Is your app a government app?**
- No

---

### Step 3.4: Main Store Listing

Navigate to **"Main store listing"**:

**App name:**
```
Oysterette
```

**Short description (80 chars):**
```
The ultimate oyster discovery app with detailed 10-point attribute ratings
```

**Full description (4000 chars):**
Copy from `docs/APP_STORE_METADATA.md` → Long Description section

**App icon (512 x 512):**
- Upload icon.png (resize to 512x512 if needed)

**Feature graphic (1024 x 500, optional but recommended):**
- Create a banner showing app screenshots and logo
- Or skip for now

**Phone screenshots:**
- Upload 2-8 screenshots (1080 x 1920 minimum)
- Upload in order (user journey)

**Tablet screenshots (optional):**
- 7" and 10" tablets if you have them

**App category:**
- Food & Drink

**Store listing contact details:**
```
Email: [YOUR SUPPORT EMAIL]
Website: [YOUR WEBSITE URL] (optional)
Phone: [YOUR PHONE] (optional)
```

Click **"Save"**

---

### Step 3.5: Production → Countries/Regions

**Available countries:**
- Select **"Add countries/regions"**
- Select **"All countries"** or choose specific ones

Click **"Save"**

---

### Step 3.6: Production → Create New Release

1. Click **"Production"** track
2. Click **"Create new release"**

**Release details:**
```
Release name: 1.0.0 - Initial Release
```

**App bundles:**
1. Click **"Upload"**
2. Upload your .aab file (downloaded from EAS)
3. Wait for processing (2-5 minutes)

Or use EAS submit:
```bash
eas submit --platform android
```

**Release notes:**
```
🎉 Welcome to Oysterette!

Discover, review, and track oysters like never before.

✨ Features:
• Browse 838+ oyster varieties
• Detailed 10-point attribute ratings
• Community reviews and ratings
• Favorite oysters with sync
• Top Oysters leaderboard
• Beautiful dark mode
• Google Sign-In support
• Advanced search and filters

Thank you for being part of our launch!
```

Click **"Next"**

---

### Step 3.7: Review Release

1. Review warnings (if any)
   - Fix any critical issues
   - Optional warnings can be acknowledged

2. **Rollout percentage:**
   - Start with: 100% (or 50% for cautious launch)

3. Click **"Start rollout to Production"**

4. Confirm rollout

**Status will change to:**
- "In review" → "Publishing" → "Published"

**Review Timeline:** 1-7 days (average 2-3 days)

---

## Part 4: Post-Submission

### Step 4.1: Monitor Status

**Apple:**
- Check App Store Connect daily
- Enable notifications for status changes
- Respond to any review feedback within 24 hours

**Google:**
- Check Play Console daily
- Review any warnings or issues
- Respond if requested

### Step 4.2: Respond to Review Feedback

**If rejected:**
1. Read rejection reason carefully
2. Fix the issue
3. Resubmit with notes explaining the fix
4. Common fixes:
   - Add Sign in with Apple (if missing)
   - Update screenshots (if misleading)
   - Fix privacy policy links (if broken)
   - Address crashes (if reported)

**If approved:**
1. Test download from store
2. Verify all features work
3. Monitor crash reports
4. Prepare for user reviews

### Step 4.3: Launch Checklist

Once approved and live:

- [ ] Test download and install from store
- [ ] Verify app works correctly from store version
- [ ] Set up monitoring (crashes, errors)
- [ ] Prepare response templates for reviews
- [ ] Monitor server load (Railway dashboard)
- [ ] Check database performance (Neon dashboard)
- [ ] Announce launch (social media, email, etc.)
- [ ] Monitor user feedback
- [ ] Plan first update

---

## Part 5: Troubleshooting

### Common Issues and Solutions

**Build not appearing in App Store Connect:**
- Wait 30 minutes after build completes
- Check for email from Apple about processing
- Verify build status in EAS dashboard
- Try uploading manually with Transporter app

**Screenshots rejected:**
- Ensure actual app screenshots (no mockups)
- Verify correct dimensions
- No device frames with wrong devices
- Accurately represents app

**Privacy Policy URL not accessible:**
- Test URL in incognito/private browser
- Ensure HTTPS (not HTTP)
- Verify no authentication required
- Check for typos in URL

**App crashes during review:**
- Test production build thoroughly
- Check for environment-specific issues
- Verify API endpoints work
- Review crash logs in EAS

**Sign in with Apple required:**
- Implement Apple Sign-In (2-4 hours)
- Or remove Google Sign-In (not recommended)
- Must offer both or neither for social login

**Google Play Data Safety errors:**
- Double-check all fields completed
- Ensure privacy policy linked
- Verify data collection accurate
- Review using docs/DATA_SAFETY_DISCLOSURE.md

---

## Part 6: Update Process (Future Releases)

### For Updates:

1. **Increment version number:**
   - Update `app.json`: version → "1.1.0"
   - Update buildNumber/versionCode

2. **Build new version:**
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

3. **Update "What's New":**
   - List new features
   - Mention bug fixes
   - Keep it concise

4. **Submit for review:**
   - Apple: Add new version in App Store Connect
   - Google: Create new release in Production track

5. **Or use OTA updates (for small changes):**
```bash
eas update --branch production --message "Bug fixes"
```
   - No review required
   - Instant delivery
   - Only for JavaScript/assets changes (not native code)

---

## Part 7: Support Resources

### Apple Support
- Developer Forums: https://developer.apple.com/forums/
- App Review: https://developer.apple.com/contact/app-store/?topic=appeal
- Technical Support: https://developer.apple.com/support/

### Google Support
- Play Console Help: https://support.google.com/googleplay/android-developer/
- Policy Support: https://support.google.com/googleplay/android-developer/contact/publishing

### Expo/EAS
- Documentation: https://docs.expo.dev/
- Forums: https://forums.expo.dev/
- Discord: https://chat.expo.dev/

---

## Quick Reference Commands

```bash
# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to Apple
eas submit --platform ios

# Submit to Google
eas submit --platform android

# Check build status
eas build:list

# Download latest build
eas build:download --platform ios
eas build:download --platform android

# Create OTA update
eas update --branch production --message "Your message"
```

---

## Timeline Summary

**Pre-Submission (4-8 hours):**
- Add Sign in with Apple: 2-4 hours
- Host legal docs: 30 min - 2 hours
- Capture screenshots: 1-2 hours
- Generate builds: 1-2 hours

**Submission (5-7 hours):**
- Apple submission: 3-4 hours
- Google submission: 2-3 hours

**Review Period:**
- Apple: 24-48 hours typically
- Google: 1-7 days typically

**Total Time to Launch:** 1-2 weeks from start to live

---

**Good luck with your submission! 🦪📱**

If you encounter issues, refer back to this guide or reach out for help.

**Last Updated:** November 7, 2025
