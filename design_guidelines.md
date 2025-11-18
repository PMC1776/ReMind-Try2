# ReMind - Design Guidelines

## Authentication Architecture

**Authentication Required** - Multi-user app with backend sync and email verification.

**Implementation:**
- Email/password authentication with JWT tokens
- Email verification flow (6-digit code with auto-advance)
- Recovery key system for encryption (must be saved on first login)
- Account management: Change password, Export data, Delete account (30-day grace period)
- Logout with token invalidation

## Navigation Architecture

**Bottom Tab Navigation (4 tabs):**
1. Map View (default home)
2. List View
3. Inbox
4. Profile/Settings

**Modal Screens:**
- Add/Edit Reminder Sheet (bottom sheet, 80% screen height)
- Location Presets Manager
- Archive View
- Recovery Key Screen

**Authentication Stack:**
- Login → Signup → Email Verification → Recovery Key

## Screen Specifications

### 1. Map View (Primary Screen)
**Layout:**
- Full-screen Google Maps (no header)
- Floating Action Button (FAB) bottom-right with "+" icon
- Top app bar (transparent background): App title + profile icon
- User location: Blue dot with accuracy circle

**Components:**
- Colored pins: Blue for "arriving," Orange for "leaving"
- Semi-transparent geofence circles around pins
- Pin clustering when zoomed out
- Reminder summary card on pin tap (Edit/Archive/Delete actions)

**Interactions:**
- Tap map → Open Add Reminder sheet with location pre-filled
- Tap pin → Show reminder card
- Long-press pin → Quick action menu
- Standard map controls (pinch, pan)

**Safe Area:**
- Bottom: `tabBarHeight + 80px` (for FAB)
- Top: `insets.top + 16px` (for transparent header)

### 2. List View
**Layout:**
- Standard navigation header with search bar
- Filter chips below header: "All" | "Arriving" | "Leaving"
- Scrollable list of reminder cards
- Checkbox toggle in header for selection mode

**Reminder Card Design:**
- Task text (bold, 16pt)
- Location name with pin icon (14pt)
- Trigger badge (rounded pill: "Arriving" blue, "Leaving" orange)
- Recurrence info (gray, 14pt)
- Swipe left → Archive (orange background)
- Swipe right → Delete (red background)

**Selection Mode:**
- Multi-select with checkboxes
- Bottom action bar: "Archive Selected" | "Delete Selected"

**Safe Area:**
- Top: `Spacing.xl`
- Bottom: `tabBarHeight + Spacing.xl`

### 3. Inbox
**Layout:**
- Standard navigation header: "Inbox" + "Clear All" button
- Scrollable list of triggered reminders

**Triggered Reminder Item:**
- Task name (bold)
- Location name + trigger type badge
- Time elapsed (e.g., "2 min ago")
- Swipe to dismiss

**Empty State:**
- Empty inbox icon (center)
- "You're all caught up!" text

**Safe Area:**
- Top: `Spacing.xl`
- Bottom: `tabBarHeight + Spacing.xl`

### 4. Profile & Settings
**Layout:**
- Scrollable form with sections

**Sections:**
1. Profile Header: Email/name, Logout, Archive buttons
2. Location Settings: Default radius slider, Accuracy mode picker, Dwell time slider
3. Notification Settings: Toggle, Test button
4. Security: Change password, View recovery key, Export data, Delete account
5. Appearance: Theme selector (Light/Dark/Auto)
6. About: Version, Privacy policy, Terms

**Safe Area:**
- Top: `Spacing.xl`
- Bottom: `tabBarHeight + Spacing.xl`

### 5. Add/Edit Reminder Sheet (Modal)
**Layout:**
- Bottom sheet, rounded top corners (12pt radius)
- Handle indicator at top
- Scrollable form

**Form Fields:**
- Task input (large, emoji picker support)
- Location (shows name, "Change Location" or "Use Current Location" buttons)
- Trigger type (segmented control: Arriving/Leaving with icons)
- Recurrence (picker: Once/Each Time/Weekly with day selector)
- Radius (slider: 50m-1km, shows in local units)
- Dwell time (slider: 0-300s, only for "Arriving")
- Assignee (optional encrypted text input)

**Actions:**
- Primary button: "Create Reminder" or "Save Changes" (bottom)
- Secondary button: "Cancel" (bottom)

**Safe Area:**
- Bottom: `insets.bottom + Spacing.xl`

## Design System

### Color Palette
- **Primary Blue:** `#3B82F6` (arriving triggers, primary actions)
- **Orange:** `#F97316` (leaving triggers, archive)
- **Success:** `#10B981`
- **Danger:** `#EF4444` (delete actions)
- **Background Light:** `#FFFFFF`
- **Background Dark:** `#1F2937`
- **Text Light:** `#111827`
- **Text Dark:** `#F9FAFB`
- **Border Light:** `#E5E7EB`
- **Border Dark:** `#374151`

### Typography
- **System Fonts:** SF Pro (iOS), Roboto (Android)
- **Headings:** Bold, 24-28pt
- **Body:** Regular, 16pt
- **Labels:** Medium, 14pt
- **Monospace:** For recovery key display

### Spacing
- **Grid System:** 8pt base
- **Card Padding:** 16pt
- **Screen Margins:** 20pt
- **Section Spacing:** 24pt

### Components
- **Corner Radius:** 8-12pt for cards/buttons
- **Shadows:** Subtle elevation shadows
- **Animations:** 250ms ease transitions
- **Haptic Feedback:** On important actions (create, delete, archive)

### Icons
- **Library:** Lucide React Native icons
- **Size:** 24pt standard
- **Color:** Match theme or semantic color

### Visual Feedback
- **Touchables:** Press state with opacity reduction (0.6)
- **FAB Shadow:**
  - `shadowOffset: { width: 0, height: 2 }`
  - `shadowOpacity: 0.10`
  - `shadowRadius: 2`
- **Swipe Actions:** Animated background color reveal

## Critical Assets

**Required Generated Assets:**
1. **Map Pin Icons** (2 variations):
   - Arriving pin (blue marker)
   - Leaving pin (orange marker)

2. **Empty State Illustrations** (2):
   - Empty inbox illustration
   - No reminders illustration

3. **App Icon:**
   - Location pin with reminder bell concept
   - Primary blue color scheme

**System Icons Only:**
- Use Lucide icons for all UI actions
- No custom icon assets needed beyond map pins

## Accessibility Requirements
- **Touch Targets:** Minimum 44x44pt for all interactive elements
- **Accessible Labels:** All buttons, inputs, and interactive elements
- **Screen Reader:** Full VoiceOver/TalkBack support
- **Color Contrast:** WCAG AA compliance (4.5:1 for text)
- **Focus Indicators:** Visible focus states for keyboard navigation

## Platform-Specific Considerations
- **iOS:** Respect safe areas, use platform-standard navigation transitions
- **Android:** Handle back button, use Material ripple effects
- **Notifications:** Platform-appropriate rich notification styles
- **Permissions:** Clear, contextual permission requests with explanations