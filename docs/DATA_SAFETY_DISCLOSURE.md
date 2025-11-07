# Google Play Data Safety Disclosure

**For: Oysterette Mobile App**
**Last Updated:** November 7, 2025

---

## Purpose

This document provides the exact answers to fill in the Google Play Console Data Safety form. Copy these responses directly into the form when submitting the app.

Google Play requires detailed disclosure of:
- What data is collected
- How data is used
- Whether data is shared with third parties
- Security practices

---

## Data Safety Form Responses

### Section 1: Does your app collect or share any of the required user data types?

**Answer:** YES

---

### Section 2: Is all of the user data collected by your app encrypted in transit?

**Answer:** YES

**Explanation:** All data transmission uses HTTPS/TLS encryption.

---

### Section 3: Do you provide a way for users to request that their data is deleted?

**Answer:** YES

**Explanation:** Users can delete their account and all associated data through Settings → Delete Account. Additionally, users can email support to request data deletion.

---

## Data Types Collected

### Personal Info

#### Email Address
- **Collected:** YES
- **Required/Optional:** Required
- **Ephemeral:** NO
- **Purpose:**
  - Account management
  - App functionality
- **Shared:** NO

#### Name
- **Collected:** YES
- **Required/Optional:** Required
- **Ephemeral:** NO
- **Purpose:**
  - Account management
  - App functionality (displayed with reviews)
- **Shared:** NO

#### User IDs
- **Collected:** YES
- **Required/Optional:** Required
- **Ephemeral:** NO
- **Purpose:**
  - Account management
  - App functionality
- **Shared:** NO
**Note:** Internal UUID for identifying users, not publicly visible.

---

### App Activity

#### App Interactions
- **Collected:** YES
- **Required/Optional:** Optional
- **Ephemeral:** NO
- **Purpose:**
  - App functionality (reviews, ratings, votes)
  - Analytics
- **Shared:** NO

**Details:**
- Oyster reviews and ratings
- Favorite oysters list
- Review votes (agree/disagree)
- Oyster submissions

#### In-app Search History
- **Collected:** NO
- **Explanation:** Search queries are not stored; they're used ephemerally for filtering.

---

### App Info and Performance

#### Crash Logs
- **Collected:** YES
- **Required/Optional:** Optional
- **Ephemeral:** YES
- **Purpose:**
  - App functionality (bug fixes)
- **Shared:** NO

**Note:** Crash logs are automatically collected via Expo/React Native error reporting. They contain device info and stack traces but no personal data.

#### Diagnostics
- **Collected:** YES
- **Required/Optional:** Optional
- **Ephemeral:** YES
- **Purpose:**
  - App functionality
  - Analytics
- **Shared:** NO

**Details:**
- App version
- Device model
- OS version
- Performance metrics

---

### Device or Other IDs

#### Device or Other IDs
- **Collected:** YES
- **Required/Optional:** Optional
- **Ephemeral:** NO
- **Purpose:**
  - App functionality (push notifications - future)
  - Analytics
- **Shared:** NO

**Note:** Device identifiers are used for crash reporting and analytics only. No advertising IDs are collected.

---

## Data NOT Collected

The following data types are NOT collected:

### Location
- Precise location: NO
- Approximate location: NO

### Financial Info
- Payment info: NO
- Purchase history: NO

### Health and Fitness
- NO data collected

### Photos and Videos
- NO (not yet implemented)

### Audio Files
- NO

### Files and Docs
- NO

### Calendar
- NO

### Contacts
- NO

### Messages
- NO (Direct messages feature removed)

### Web Browsing
- NO

---

## Data Sharing

### Do you share any data with third parties?

**Answer:** NO

**Explanation:** We do NOT share user data with third parties for advertising, analytics, or any other purpose.

#### Third-Party Services Used (No Data Sharing):

**Google Sign-In:**
- Purpose: Authentication only
- Data flow: One-way (Google to us)
- No data shared back to Google beyond initial auth

**Railway (Hosting):**
- Purpose: Backend hosting
- Data Processing Agreement: YES
- User data stored on servers but not shared with Railway
for purposes

**Neon (Database):**
- Purpose: Database hosting
- Data Processing Agreement: YES
- User data stored but not accessed by Neon

---

## Data Security Practices

### Encryption in Transit
- **Status:** YES
- **Method:** HTTPS/TLS for all API calls

### Encryption at Rest
- **Status:** YES
- **Method:** Database encryption provided by Neon PostgreSQL

### Authentication Security
- **Password Storage:** Bcrypt hashing (never stored in plain text)
- **Token-Based Auth:** JWT with expiration
- **OAuth:** Google Sign-In (industry standard)

### Additional Security Measures
- Rate limiting (prevents brute-force attacks)
- Input validation (prevents injection attacks)
- Secure local storage (AsyncStorage encrypted by OS)
- Regular security updates

---

## Data Retention and Deletion

### Active Accounts
- Data retained while account is active
- Users can delete their data at any time

### Deleted Accounts
- Personal data deleted within 30 days
- Reviews may be anonymized (author name removed) to preserve community ratings
- Complete deletion available upon request

### Backup Retention
- Database backups retained for 30 days for disaster recovery
- After 30 days, deleted data is permanently removed

---

## User Control

### What Users Can Control:
1. **Profile Visibility:** Public, Friends Only, or Private
2. **Display Preferences:** Show/hide review history, favorites, statistics
3. **Data Access:** View all their data in the app
4. **Data Export:** Request JSON/CSV export via email
5. **Data Deletion:** Delete account and all data via Settings

### How to Exercise Rights:
- **In-App:** Settings → Privacy Settings
- **In-App Deletion:** Settings → Delete Account
- **Email Requests:** [YOUR SUPPORT EMAIL]

---

## Target Audience

### Age Rating
- **Minimum Age:** 4+ (Google Play)
- **Target Audience:** Adults interested in food and dining
- **Not Directed at Children:** No

### Content Rating
- **Violence:** None
- **Sexual Content:** None
- **Profanity:** None
- **Alcohol/Drugs:** Food and beverage content only
- **Gambling:** None

---

## Data Collection Consent

### How Users Consent:
1. Privacy Policy link shown at registration
2. Users must create account to use most features
3. Browsing mode available without account (limited features)
4. Explicit consent during Google OAuth flow

---

## Google Play Data Safety Checklist

Use this checklist when filling out the form:

- [ ] Select "YES" for data collection
- [ ] Select "YES" for encryption in transit
- [ ] Select "YES" for data deletion option
- [ ] Select "NO" for data sharing with third parties
- [ ] Mark email address as COLLECTED, REQUIRED
- [ ] Mark name as COLLECTED, REQUIRED
- [ ] Mark user IDs as COLLECTED, REQUIRED
- [ ] Mark app interactions as COLLECTED, OPTIONAL
- [ ] Mark crash logs as COLLECTED, OPTIONAL, EPHEMERAL
- [ ] Mark diagnostics as COLLECTED, OPTIONAL, EPHEMERAL
- [ ] Mark device IDs as COLLECTED, OPTIONAL
- [ ] Ensure all "Purpose" fields are filled
- [ ] Ensure all "Shared" fields are set to NO
- [ ] Link to Privacy Policy: [YOUR PRIVACY POLICY URL]

---

## Questions During Form Submission

### "Does your app collect or share data for advertising purposes?"
**Answer:** NO

### "Does your app collect data for analytics purposes?"
**Answer:** YES (basic usage analytics for app improvement only)

### "Does your app use third-party analytics SDKs?"
**Answer:** NO (We use our own backend analytics)

### "Is your app directed at children?"
**Answer:** NO

### "Does your app contain ads?"
**Answer:** NO

### "Does your app offer in-app purchases?"
**Answer:** NO

---

## Support Contact

For questions about data practices:
- **Email:** [YOUR SUPPORT EMAIL]
- **Privacy Policy:** [YOUR PRIVACY POLICY URL]
- **Website:** [YOUR WEBSITE URL]

---

**This disclosure is accurate as of November 7, 2025.**

Update this document if app functionality changes to collect additional data types.
