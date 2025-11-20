# ReMind App - Style Guide & Implementation

## Overview
This style guide establishes the visual design system for ReMind. All colors should be centralized in a single location so changes flow through the entire app automatically.

---

## Color Palette

### Primary Colors
- **Coral (Main Action):** `#FF6B6B`
  - Use for: Primary buttons, selected states, active toggles, "me" indicators, focused inputs
- **Coral Dark (Pressed State):** `#E85555`
  - Use for: Button press states, hover effects
- **Coral Light (Subtle Backgrounds):** `#FFE5E5`
  - Use for: Highlight backgrounds, very subtle emphasis areas

### Background Colors
- **App Background:** `#FFF8F6`
  - Use for: Main app background (entire screen behind cards/modals)
- **Surface/Cards:** `#FFFFFF`
  - Use for: Modal backgrounds, card backgrounds, elevated surfaces
- **Secondary Surface:** `#F5F5F5`
  - Use for: Unselected pill buttons, inactive states

### Border & Divider Colors
- **Border:** `#E8E8E8`
  - Use for: Card borders, dividing lines, input borders
- **Disabled:** `#C4C4C4`
  - Use for: Disabled button backgrounds, inactive elements

### Text Colors
- **Primary Text:** `#1A1A1A`
  - Use for: Main headings, reminder titles, important text
- **Secondary Text:** `#6B6B6B`
  - Use for: Labels ("Who?", "What?", "When?"), subtext, descriptions
- **Tertiary Text:** `#999999`
  - Use for: Placeholder text, hints, timestamps

### Supporting Colors
- **Success:** `#4CAF50`
  - Use for: Confirmation messages, success indicators, "reminder set" feedback
- **Destructive:** `#DC3545`
  - Use for: Delete actions, error states, destructive confirmations
- **Info Background:** `#F0F9FF`
  - Use for: Info banners, tips, help text backgrounds

---

## Implementation Instructions

### For React Native:

Create a file called `colors.ts` or `theme.ts` in your project:

```typescript
// colors.ts or theme.ts
export const colors = {
  // Primary
  coral: '#FF6B6B',
  coralDark: '#E85555',
  coralLight: '#FFE5E5',
  
  // Backgrounds
  background: '#FFF8F6',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F5F5',
  
  // Borders & Dividers
  border: '#E8E8E8',
  disabled: '#C4C4C4',
  
  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#999999',
  
  // Supporting
  success: '#4CAF50',
  destructive: '#DC3545',
  infoBackground: '#F0F9FF',
};
```

Then import and use throughout the app:
```typescript
import { colors } from './colors';

// Example usage:
<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.textPrimary }}>Title</Text>
  <TouchableOpacity style={{ backgroundColor: colors.coral }}>
    <Text>Button</Text>
  </TouchableOpacity>
</View>
```

### For Web App (React):

Create a CSS file with variables:

```css
/* styles/colors.css or theme.css */
:root {
  /* Primary */
  --color-coral: #FF6B6B;
  --color-coral-dark: #E85555;
  --color-coral-light: #FFE5E5;
  
  /* Backgrounds */
  --color-background: #FFF8F6;
  --color-surface: #FFFFFF;
  --color-surface-secondary: #F5F5F5;
  
  /* Borders & Dividers */
  --color-border: #E8E8E8;
  --color-disabled: #C4C4C4;
  
  /* Text */
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B6B6B;
  --color-text-tertiary: #999999;
  
  /* Supporting */
  --color-success: #4CAF50;
  --color-destructive: #DC3545;
  --color-info-bg: #F0F9FF;
}

body {
  background-color: var(--color-background);
}
```

Then use in your CSS:
```css
.button-primary {
  background-color: var(--color-coral);
  color: var(--color-surface);
}

.button-primary:active {
  background-color: var(--color-coral-dark);
}

.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
}
```

---

## Component-Specific Usage

### Map Screen
- **Header background:** `colors.surface` (white)
- **Search bar background:** `colors.surface` with `colors.border` border
- **Map background:** Tinted with `colors.background` if possible, otherwise default

### New Reminder Modal
- **Modal background:** `colors.surface` (white card)
- **App background (dimmed area):** `colors.background` with opacity
- **Selected pills (me, Arriving, Current Location, Once):** `colors.coral` background with white text
- **Unselected pills (JD, JS, +, Leaving, Custom, Always):** `colors.surfaceSecondary` background with `colors.textPrimary`
- **Labels (Who?, What?, When?):** `colors.textSecondary`
- **Primary button (Set Reminder) when enabled:** `colors.coral`
- **Primary button when disabled:** `colors.disabled`

### Reminder List Screen
- **Card backgrounds:** `colors.surface` (white)
- **"me" indicator bubble:** `colors.coral` background with white text
- **Card borders:** `colors.border`
- **Reminder title:** `colors.textPrimary`
- **Location text:** `colors.textSecondary`
- **Bottom buttons (View Archive, Select):** `colors.surfaceSecondary` background with `colors.textPrimary`

### Recurring Settings Modal
- **Toggle switches (enabled state):** `colors.coral`
- **Toggle switches (disabled state):** `colors.disabled`
- **Day selector pills (selected):** `colors.coral` background with white text
- **Day selector pills (unselected):** `colors.surfaceSecondary` with `colors.textPrimary`
- **Info text:** `colors.textSecondary`
- **Icon backgrounds:** `colors.coralLight`

---

## Typography (for future reference)

### Font Weights
- **Bold (Headings):** 600-700
- **Regular (Body):** 400
- **Light (Hints):** 300

### Font Sizes
- **Large Titles:** 28px
- **Titles:** 20px
- **Body:** 16px
- **Labels:** 14px
- **Captions:** 12px

---

## Spacing & Layout Principles

### Consistency Rules
- **Card padding:** 16px
- **Modal padding:** 20px
- **Button padding:** 12px vertical, 24px horizontal
- **Between sections:** 24px
- **Between related elements:** 12px

### Border Radius
- **Cards:** 16px
- **Buttons:** 12px
- **Pills:** 20px (fully rounded)
- **Input fields:** 12px

---

## Key Design Principles

1. **The coral is the signature** - Use it sparingly for primary actions and selected states only
2. **White cards on tinted background** - Creates visual hierarchy without harsh contrast
3. **Ample breathing room** - Don't crowd elements; generous spacing = premium feel
4. **Consistent touch targets** - All interactive elements should be minimum 44px tall
5. **Clear visual hierarchy** - Size and color should make importance obvious

---

## Testing Checklist

After implementation, verify:
- [ ] All instances of old blue (#007AFF or similar) are replaced with coral
- [ ] App background is peachy-cream, not stark white
- [ ] Cards/modals are pure white and pop against background
- [ ] Selected states use coral consistently
- [ ] Disabled states are clearly distinguishable
- [ ] Text hierarchy is clear (primary/secondary/tertiary)
- [ ] Colors are referenced from central location (not hardcoded)
- [ ] Test in both light indoor and bright outdoor conditions

---

## Future Color Adjustments

If colors need tweaking, ONLY edit the central color file (colors.ts or :root CSS variables). Changes will automatically flow through the entire app. Do not hardcode hex values anywhere else in the codebase.

**Quick swap testing:** If Piper wants to experiment with different accent colors, she only needs to change the `coral`, `coralDark`, and `coralLight` values in one place.

