# Oysterette App Store Deployment Plan

**Phase 12: App Store Deployment**
**Estimated Time:** 16-24 hours
**Target:** Production release to Apple App Store and Google Play Store

---

## 📊 Current Status

**App Details:**
- Name: Oysterette
- Version: 1.1.0
- Build: iOS 7, Android 7
- Package: com.oysterette.app
- EAS Project ID: 71f928a7-e51a-4136-8b2d-b1c3ff5dcda7

**Already Complete:**
- ✅ EAS Build configured
- ✅ OTA Updates working
- ✅ Production backend (Railway)
- ✅ Google OAuth configured
- ✅ App icons and splash screen
- ✅ HTTPS for all API calls
- ✅ Secure token storage
- ✅ Input validation
- ✅ Rate limiting

---

## 🎯 Deployment Phases

### Phase A: Legal Documents & Policies (2-3 hours)
**What I'll Create:**
- [ ] Privacy Policy document
- [ ] Terms of Service document
- [ ] Data Safety Disclosure content
- [ ] In-app privacy disclosures text

**What You'll Need to Do:**
- [ ] Review and approve legal documents
- [ ] Host privacy policy and terms on a public URL (options: GitHub Pages, your website, or dedicated hosting)
- [ ] Optionally: Have lawyer review (recommended for commercial apps)

---

### Phase B: App Store Compliance (2-3 hours)
**What I'll Do:**
- [ ] Review Apple App Store guidelines
- [ ] Review Google Play Store policies
- [ ] Check for compliance issues
- [ ] Update app.json with store metadata
- [ ] Prepare compliance checklist

**What You'll Need:**
- [ ] Apple Developer Account ($99/year) - Sign up at https://developer.apple.com
- [ ] Google Play Console Account ($25 one-time) - Sign up at https://play.google.com/console

---

### Phase C: Store Listings & Assets (4-6 hours)
**What I'll Create:**
- [ ] App description (short & long)
- [ ] Feature list
- [ ] What's New text
- [ ] Keywords for search optimization
- [ ] Screenshot requirements document
- [ ] App preview video script (optional)

**What You'll Need to Provide:**
- [ ] Screenshots (I'll give you exact specs)
  - iPhone: 6.7" display (iPhone 15 Pro Max or similar)
  - iPad: 12.9" display (iPad Pro or similar)
  - Android: Various sizes
- [ ] Or: Grant me access to test device to capture screenshots
- [ ] Optional: Screen recording for app preview video

---

### Phase D: Build Preparation (2-3 hours)
**What I'll Do:**
- [ ] Update version to 1.0.0 (store launch version)
- [ ] Generate production builds
  - iOS: .ipa file for App Store
  - Android: .aab bundle for Play Store
- [ ] Test builds on devices
- [ ] Verify all features work in production mode

**Requirements:**
- [ ] EAS CLI configured (already done)
- [ ] Apple certificates and provisioning profiles (EAS handles this)
- [ ] Android signing key (EAS handles this)

---

### Phase E: Apple App Store Submission (3-4 hours)
**What I'll Prepare:**
- [ ] Complete App Store Connect checklist
- [ ] TestFlight setup instructions
- [ ] Beta testing plan
- [ ] Review submission checklist

**What You'll Do:**
1. [ ] Log into App Store Connect
2. [ ] Create new app listing
3. [ ] Upload build via EAS or Transporter
4. [ ] Fill in store information (I'll provide content)
5. [ ] Submit for TestFlight beta
6. [ ] After testing: Submit for App Store review
7. [ ] Respond to any review feedback

**Apple Review Timeline:** 24-48 hours typically

---

### Phase F: Google Play Store Submission (3-4 hours)
**What I'll Prepare:**
- [ ] Complete Play Console checklist
- [ ] Data safety form content
- [ ] Store listing content
- [ ] Internal testing setup instructions

**What You'll Do:**
1. [ ] Log into Google Play Console
2. [ ] Create new app
3. [ ] Upload .aab bundle
4. [ ] Fill in store listing (I'll provide content)
5. [ ] Complete data safety form (I'll provide answers)
6. [ ] Set up internal testing track
7. [ ] Submit for production review

**Google Review Timeline:** 1-7 days typically

---

### Phase G: Post-Launch (2-3 hours)
**What I'll Help With:**
- [ ] Monitor crash reports
- [ ] Set up analytics (optional)
- [ ] Plan first update
- [ ] Response templates for user reviews
- [ ] Marketing assets for social media

---

## 📝 Detailed Task Breakdown

### Task 1: Create Legal Documents
**Time:** 2-3 hours
**Priority:** HIGH - Required before submission

I will create:
1. **Privacy Policy** covering:
   - Data collection (email, name, reviews, favorites)
   - Google OAuth integration
   - AsyncStorage usage
   - Backend data storage
   - No data selling
   - User rights (access, deletion)
   - Contact information

2. **Terms of Service** covering:
   - User responsibilities
   - Content guidelines (reviews)
   - Account termination
   - Intellectual property
   - Limitation of liability
   - Governing law

3. **Data Safety Disclosure** (Google Play):
   - Precise list of data collected
   - How data is used
   - Data sharing practices
   - Security measures

4. **In-App Disclosures** (Apple):
   - Privacy nutrition labels
   - Data practices summary

**Output:** 4 markdown files ready for hosting

---

### Task 2: App Store Metadata
**Time:** 2 hours
**Priority:** HIGH

I will create:
- **App Name:** Oysterette
- **Subtitle:** Discover, Review & Track Oysters
- **Short Description** (80 chars): "The ultimate oyster discovery app with 10-point ratings"
- **Long Description** (4000 chars): Comprehensive feature list
- **Keywords:** oyster, seafood, restaurant, review, rating, food, dining
- **Category:** Food & Drink (Primary), Lifestyle (Secondary)
- **Age Rating:** 4+ (no objectionable content)
- **Support URL:** (need to provide)
- **Marketing URL:** (optional)

**Output:** Complete metadata file for both stores

---

### Task 3: Screenshot Strategy
**Time:** 1 hour planning + your time to capture

**Apple Requirements:**
- 6.7" iPhone display (1290 x 2796 pixels)
- 12.9" iPad Pro display (2048 x 2732 pixels)
- Minimum 3 screenshots, maximum 10

**Google Requirements:**
- Phone: 1080 x 1920 minimum
- 7" Tablet: 1080 x 1920 minimum
- 10" Tablet: 1200 x 1920 minimum
- Minimum 2 screenshots, maximum 8

**Suggested Screenshots:**
1. Home screen with logo and buttons
2. Oyster list with search/filters
3. Oyster detail with ratings
4. Review screen with sliders
5. Profile with stats
6. Dark mode view (optional but recommended)

I'll provide:
- Exact pixel dimensions for each device
- Mockup templates (optional)
- Best practices guide
- Caption suggestions

---

### Task 4: Build Configuration
**Time:** 2 hours
**Priority:** HIGH

What I'll do:
1. Update version to 1.0.0 (reset for store launch)
2. Verify all environment variables
3. Add store metadata to app.json
4. Configure app permissions properly
5. Test production builds locally
6. Generate final store builds

Commands I'll run:
```bash
# iOS Production Build
eas build --platform ios --profile production

# Android Production Build
eas build --platform android --profile production
```

---

### Task 5: Compliance Checklist
**Time:** 2 hours

I'll verify:
- [ ] No hardcoded API keys (checked ✅)
- [ ] All network calls use HTTPS (checked ✅)
- [ ] Proper error handling everywhere
- [ ] No crashe on clean install
- [ ] Google OAuth consent screen configured
- [ ] Privacy policy linked in app settings
- [ ] Terms of service accessible
- [ ] Account deletion works
- [ ] Data export possible (if required)
- [ ] Offline functionality graceful
- [ ] Loading states everywhere
- [ ] Proper app permissions requested
- [ ] No unused permissions
- [ ] Content rating appropriate

---

## 🚀 Execution Order

**Week 1 (Now):**
1. Create all legal documents
2. Set up hosting for legal documents
3. Create store listings and metadata
4. Prepare screenshot specifications

**Week 2:**
5. You: Capture screenshots using test device
6. Me: Generate production builds
7. Me: Prepare submission checklists

**Week 3:**
8. You: Create developer accounts (if not done)
9. You: Submit to TestFlight (Apple)
10. You: Submit to internal testing (Google)

**Week 4:**
11. Fix any issues found in testing
12. Submit for production review (both stores)
13. Launch! 🎉

---

## 💰 Costs

**One-Time:**
- Google Play Developer: $25
- Google Cloud (OAuth): Free tier (current usage)

**Annual:**
- Apple Developer: $99/year
- Railway (backend): ~$5-10/month
- Neon (database): Free tier (current usage)
- EAS Build: Free tier (current usage, 30 builds/month)

**Total First Year:** ~$124 + ~$60 = ~$184

---

## ⚠️ Important Notes

1. **Privacy Policy URL Required:** Must be publicly accessible BEFORE submission
2. **Support Email Required:** Need a real email for user support
3. **Age Rating:** Current app is 4+ (no objectionable content)
4. **Export Compliance:** Not exporting encryption (standard HTTPS only)
5. **Content Rating:** No violence, gambling, or adult content
6. **Account Deletion:** Already implemented in app ✅
7. **Data Deletion:** Need to add backend endpoint for complete data deletion
8. **Review Time:** Apple ~2 days, Google 1-7 days (plan accordingly)

---

## 🎯 Success Criteria

**Before Submission:**
- [ ] All legal documents created and hosted
- [ ] All screenshots captured and optimized
- [ ] Production builds tested on real devices
- [ ] Crash-free on fresh install
- [ ] All features work without backend issues

**After Approval:**
- [ ] App visible in both stores
- [ ] Users can download and install
- [ ] All features work in production
- [ ] No crashes reported in first 48 hours
- [ ] Positive initial reviews

---

## 📞 Support

**Developer Support:**
- Apple: https://developer.apple.com/contact/
- Google: https://support.google.com/googleplay/android-developer/

**Review Guidelines:**
- Apple: https://developer.apple.com/app-store/review/guidelines/
- Google: https://play.google.com/about/developer-content-policy/

---

## Next Steps

Reply with:
- **Option A:** "Let's do everything" - I'll create all documents and prepare everything
- **Option B:** "Just legal docs first" - I'll create privacy policy and terms only
- **Option C:** "Show me what it takes" - I'll break down just the first task in detail

Let's get Oysterette into the app stores! 🦪📱
