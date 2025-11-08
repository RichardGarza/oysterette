# Screenshot Specifications for Oysterette

**For:** Apple App Store & Google Play Store Submission
**Last Updated:** November 7, 2025

---

## Quick Summary

**Minimum Required:**
- **Apple:** 3 iPhone screenshots (6.7" display)
- **Google:** 2 phone screenshots (1080 x 1920 minimum)

**Recommended:**
- 5-6 screenshots for both platforms
- Show key features and user journey
- Add captions/text overlays (optional but helpful)
- Include both light and dark mode (optional)

---

## Apple App Store Requirements

### iPhone Screenshots (REQUIRED)

**6.7" Display (iPhone 15 Pro Max, 14 Pro Max, 13 Pro Max, 12 Pro Max)**
- **Resolution:** 1290 x 2796 pixels (portrait)
- **Minimum:** 3 screenshots
- **Maximum:** 10 screenshots
- **Format:** PNG or JPEG
- **File Size:** Up to 500 MB each
- **Color Space:** sRGB or Display P3

### iPad Screenshots (OPTIONAL but recommended)

**12.9" iPad Pro (6th/5th/4th/3rd gen)**
- **Resolution:** 2048 x 2732 pixels (portrait)
- **Minimum:** 3 screenshots
- **Maximum:** 10 screenshots
- **Format:** PNG or JPEG

### Additional Device Sizes (OPTIONAL)

If you want to optimize for specific devices:
- **6.5" Display:** 1242 x 2688 pixels (iPhone 11 Pro Max, XS Max)
- **5.5" Display:** 1242 x 2208 pixels (iPhone 8 Plus, 7 Plus, 6s Plus)

**Note:** Apple scales screenshots automatically, so 6.7" covers most devices.

---

## Google Play Store Requirements

### Phone Screenshots (REQUIRED)

**Minimum Requirements:**
- **Resolution:** 1080 x 1920 pixels minimum
- **Maximum:** 7680 x 4320 pixels
- **Aspect Ratio:** 16:9 to 2:1
- **Minimum:** 2 screenshots
- **Maximum:** 8 screenshots
- **Format:** PNG or JPEG (24-bit)
- **File Size:** Up to 8 MB each

**Recommended Resolution:** 1080 x 1920 or 1440 x 2560

### Tablet Screenshots (OPTIONAL)

**7" Tablet:**
- **Resolution:** 1080 x 1920 minimum
- **Minimum:** 2 screenshots
- **Maximum:** 8 screenshots

**10" Tablet:**
- **Resolution:** 1200 x 1920 minimum
- **Minimum:** 2 screenshots
- **Maximum:** 8 screenshots

---

## Recommended Screenshot Content

### Screenshot 1: Home Screen
**Showcase:** App branding and main entry point

**What to Capture:**
- Oysterette logo
- "Browse Oysters" button
- "🏆 Top Oysters" button
- Clean, welcoming interface

**Caption Idea:** "Welcome to Oysterette - Your Oyster Discovery Companion"

**Why:** First impression matters—show your beautiful, clean design

---

### Screenshot 2: Oyster List
**Showcase:** Browsing experience with filters

**What to Capture:**
- List of oyster cards with images (if added) or clean cards
- Search bar at top
- Filter button showing active filters
- Multiple oyster cards visible
- Favorite heart icons
- Rating stars/scores

**Caption Idea:** "Browse 130+ Oyster Varieties from Around the World"

**Why:** Shows the breadth of content and discovery features

---

### Screenshot 3: Oyster Detail
**Showcase:** Detailed oyster information

**What to Capture:**
- Oyster name and origin
- Overall rating with emoji (🏆 Outstanding, ⭐ Excellent, etc.)
- 5 attribute bars (Size, Body, Sweet/Briny, Flavor, Creamy)
- Descriptive labels (e.g., "Huge", "Baddy McFatty")
- Review count
- "Write Review" button prominent

**Caption Idea:** "10-Point Attribute System for Precise Ratings"

**Why:** Highlights your unique rating system—key differentiator

---

### Screenshot 4: Add Review Screen
**Showcase:** Review creation interface

**What to Capture:**
- Overall rating buttons (❤️ Love It, 👍 Like It, 😐 Meh, 🤷 Whatever)
- 5 attribute sliders with labels
- Slider showing dynamic word (e.g., "Huge" for size 10)
- Notes text area
- "Submit Review" button

**Caption Idea:** "Share Your Oyster Experience with Detailed Reviews"

**Why:** Shows how easy it is to contribute to the community

---

### Screenshot 5: Profile Screen
**Showcase:** User stats and achievements

**What to Capture:**
- User name with avatar circle
- Stats grid (Reviews, Favorites, Badge, Votes, Avg Rating, Streak)
- Credibility badge (⭐ Trusted or 🏆 Expert if possible)
- "Taste Insights" section
- Recent review history

**Caption Idea:** "Track Your Oyster Journey and Earn Credibility Badges"

**Why:** Shows gamification and personal tracking features

---

### Screenshot 6: Top Oysters Leaderboard
**Showcase:** Community's highest-rated oysters

**What to Capture:**
- "Top Oysters" title
- Rank badges (#1, #2, #3)
- Oyster cards with high ratings
- Clean leaderboard design
- Overall scores visible

**Caption Idea:** "Discover the Community's Highest-Rated Oysters"

**Why:** Social proof and helps users discover quality oysters

---

### Screenshot 7: Dark Mode (OPTIONAL)
**Showcase:** Beautiful dark theme

**What to Capture:**
- Any of the above screens in dark mode
- Preferably oyster list or detail screen
- Show contrast and readability

**Caption Idea:** "Beautiful Dark Mode for Comfortable Browsing"

**Why:** Dark mode is popular—shows you support it

---

## How to Capture Screenshots

### Method 1: Physical Device (RECOMMENDED)

**For iPhone:**
1. Use an iPhone 15 Pro Max, 14 Pro Max, 13 Pro Max, or 12 Pro Max
2. Navigate to the screen you want to capture
3. Press Volume Up + Side Button simultaneously
4. Screenshots saved to Photos app
5. AirDrop or email to computer

**For Android:**
1. Use a device with 1080x1920 or higher resolution
2. Navigate to the screen you want to capture
3. Press Volume Down + Power Button
4. Screenshots saved to Gallery
5. Transfer to computer

**Tip:** Clean up test data before capturing. Use real-looking content.

### Method 2: Emulator/Simulator

**iPhone Simulator (Mac required):**
```bash
# Open simulator for iPhone 15 Pro Max
open -a Simulator
# In Simulator: Hardware → Device → iPhone 15 Pro Max
# File → New Screen Shot (⌘S)
```

**Android Emulator:**
```bash
# Create AVD with Pixel 6 Pro or similar
# Use camera button in emulator toolbar
```

**Tip:** Simulators are easier to get exact resolutions but may look less realistic.

### Method 3: Using EAS Build + TestFlight

1. Build production version: `eas build --platform ios --profile production`
2. Download build to TestFlight
3. Install on physical device
4. Capture screenshots

---

## Screenshot Checklist

Before uploading to store:

- [ ] Correct resolution for platform
- [ ] All text visible and readable
- [ ] No test/dummy data visible
- [ ] Status bar clean (or removed)
- [ ] Good lighting/contrast
- [ ] No pixelation or blur
- [ ] Consistent theme across screenshots (all light or all dark)
- [ ] Ordered logically (user journey)
- [ ] File sizes under limits
- [ ] Saved in correct format (PNG or JPEG)

---

## Pro Tips

### 1. Status Bar Cleanup
**Hide status bar elements:**
- Set time to 9:41 (Apple's marketing time)
- Full battery indicator
- Full WiFi/cellular signal
- No notifications visible

**Tools:** Use screenshot mockup generators (optional)

### 2. Add Text Overlays (OPTIONAL)
**Benefits:**
- Explain features clearly
- Increase conversion rates
- Guide user through value proposition

**Tools:**
- Figma (free)
- Canva (free tier)
- Sketch (Mac only, paid)
- Adobe Photoshop

**Design Tips:**
- Use large, bold fonts
- High contrast text (white on dark overlay, or vice versa)
- Brief captions (5-10 words max)
- Consistent style across all screenshots

### 3. Use Device Frames (OPTIONAL)
**Pros:**
- Looks more professional
- Shows device context
- Popular in app marketing

**Cons:**
- Takes more space
- Not required by stores
- Can be distracting

**Tools:**
- Facebook Design's Devices
- Screely.com
- MockUPhone.com

### 4. Highlight Key Features
**Use visual indicators:**
- Arrows pointing to important UI elements
- Circles highlighting features
- Annotations explaining unique aspects

**Keep it subtle—don't clutter the screenshot.**

---

## Screenshot Upload Order

### Recommended Order (User Journey):
1. Home Screen (welcome/entry)
2. Oyster List (browse/discover)
3. Oyster Detail (information)
4. Add Review (contribute)
5. Profile (track progress)
6. Top Oysters (social proof)

**Tip:** First 2-3 screenshots are most important—they appear in search results.

---

## Localization (Future)

When adding new languages:
- Capture screenshots in each language
- Ensure text fits UI elements
- Update captions in target language
- Consider cultural context

**Current:** English only

---

## Screenshot Templates

### Caption Templates (If Adding Text)

**Feature-Focused:**
- "Discover [NUMBER] Oyster Varieties"
- "Detailed 10-Point Attribute Ratings"
- "Track Your Favorites Across Devices"
- "Join a Community of Oyster Lovers"

**Benefit-Focused:**
- "Never Forget Your Favorite Oyster"
- "Make Informed Oyster Choices"
- "Share Your Tasting Experiences"
- "Find the Perfect Oyster for You"

**Action-Focused:**
- "Start Your Oyster Journey Today"
- "Browse, Review, Track - It's That Easy"
- "Discover Oysters Near You" (future feature)

---

## Testing Screenshot Quality

### Before Finalizing:

1. **View on actual device**
   - Does it look good on small screen?
   - Is text readable?
   - Are icons clear?

2. **Check on computer**
   - Zoom in to 100%
   - Look for pixelation or artifacts
   - Verify colors are accurate

3. **Ask someone else**
   - Do they understand what the app does?
   - Are features clear without explanation?
   - Would they download the app?

---

## Common Mistakes to Avoid

❌ **Don't:**
- Use placeholder text (Lorem ipsum)
- Show test accounts or dummy data
- Include outdated UI (from old versions)
- Use screenshots from competitor apps
- Show errors or bugs
- Have inconsistent themes (mixing light/dark randomly)
- Use low-resolution images
- Crop important UI elements
- Show personal information

✅ **Do:**
- Use realistic, appealing content
- Show actual features
- Maintain visual consistency
- Highlight unique value propositions
- Keep screenshots up to date
- Show happy paths (successful flows)

---

## File Naming Convention

Keep files organized:

```
apple_iphone_6.7_01_home.png
apple_iphone_6.7_02_list.png
apple_iphone_6.7_03_detail.png
apple_iphone_6.7_04_review.png
apple_iphone_6.7_05_profile.png

google_phone_01_home.png
google_phone_02_list.png
google_phone_03_detail.png
google_phone_04_review.png
google_phone_05_profile.png
```

---

## Screenshot Approval Checklist

### Before Submitting to Store:

Apple:
- [ ] 1290 x 2796 pixels (6.7" iPhone)
- [ ] Minimum 3 screenshots uploaded
- [ ] Correct order (user journey)
- [ ] All screenshots clear and high-quality
- [ ] No prohibited content visible
- [ ] Accurately represents app functionality

Google:
- [ ] 1080 x 1920 pixels minimum
- [ ] Minimum 2 screenshots uploaded
- [ ] Clear and high-quality
- [ ] Shows app in use
- [ ] No misleading content

---

## Next Steps

1. **Capture Screenshots:**
   - Use physical device or simulator
   - Follow recommended content guide above
   - Capture 5-6 key screens

2. **Edit (Optional):**
   - Add text captions
   - Enhance contrast/brightness
   - Add device frames
   - Resize if needed

3. **Organize:**
   - Name files clearly
   - Keep originals as backup
   - Create separate folders for Apple/Google

4. **Upload:**
   - App Store Connect (Apple)
   - Play Console (Google)
   - Preview in store listing

---

## Resources

### Screenshot Tools
- **Xcode Simulator:** Built into Xcode (Mac only)
- **Android Studio:** Built-in emulator
- **Figma:** Free design tool for mockups
- **Canva:** Free graphic design tool
- **Screenshot Mockup Generators:**
  - AppLaunchpad.com
  - PlaceIt.net
  - MockUPhone.com

### Inspiration
- Browse top Food & Drink apps in stores
- Look at well-reviewed competitors
- Check Apple's App Store guidelines for examples

---

**Need Help?**

If you're having trouble capturing screenshots:
1. Share device/OS you're using
2. I can provide specific command-line tools
3. Or, grant test access and I can capture from TestFlight

---

**Last Updated:** November 7, 2025
