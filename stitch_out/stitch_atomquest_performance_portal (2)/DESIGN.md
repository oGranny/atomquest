---
name: Industrial-Modern Precision
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#4d4732'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#7e775f'
  outline-variant: '#d0c6ab'
  surface-tint: '#705d00'
  primary: '#705d00'
  on-primary: '#ffffff'
  primary-container: '#ffd700'
  on-primary-container: '#705e00'
  inverse-primary: '#e9c400'
  secondary: '#575e70'
  on-secondary: '#ffffff'
  secondary-container: '#d9dff5'
  on-secondary-container: '#5c6274'
  tertiary: '#585f6c'
  on-tertiary: '#ffffff'
  tertiary-container: '#d3daea'
  on-tertiary-container: '#585f6d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffe16d'
  primary-fixed-dim: '#e9c400'
  on-primary-fixed: '#221b00'
  on-primary-fixed-variant: '#544600'
  secondary-fixed: '#dce2f7'
  secondary-fixed-dim: '#c0c6db'
  on-secondary-fixed: '#141b2b'
  on-secondary-fixed-variant: '#404758'
  tertiary-fixed: '#dce2f3'
  tertiary-fixed-dim: '#c0c7d6'
  on-tertiary-fixed: '#151c27'
  on-tertiary-fixed-variant: '#404754'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
typography:
  headline-xl:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
This design system embodies an "Industrial-Modern" aesthetic, merging technical precision with high-energy accents. It is designed for users who value efficiency, modularity, and clarity. The brand personality is authoritative yet approachable, utilizing heavy whitespace to reduce cognitive load while employing bold color hits to drive action.

The design style leans into **Minimalism** with a **Corporate Modern** structure. It utilizes a "modular card" philosophy where content is encapsulated in distinct containers, providing a sense of physical organization. While the foundation is grounded in utility, the inclusion of glassmorphism for status indicators adds a layer of contemporary sophistication.

## Colors
The palette is built on a high-contrast foundation to ensure immediate visual hierarchy. 

- **Primary (Yellow):** Used exclusively for call-to-action elements, primary buttons, and critical progress indicators. It represents energy and "quest" completion.
- **Secondary (Charcoal):** Applied to sidebars, primary navigation, and headers. This provides the "industrial" weight and grounds the lighter elements.
- **Neutral/Background:** A combination of neutral whites and cool grays creates a layered effect for the modular card system, allowing surface depth to be communicated through color shifts rather than just shadows.

## Typography
The typography strategy relies on the interplay between two geometric sans-serifs. **Montserrat** is used for headlines to provide a bold, architectural feel that commands attention. **Inter** is utilized for body copy and UI labels due to its exceptional legibility and systematic appearance.

Maintain high contrast by keeping headlines in the secondary charcoal color (#111827). For secondary information or metadata, use the tertiary gray. Tracking should be tightened slightly on large headlines and loosened for small uppercase labels to maintain the technical industrial look.

## Layout & Spacing
This design system utilizes a **Fixed Grid** model for desktop (1280px max-width) and a **Fluid Grid** for mobile devices. The layout is structured on an 8px rhythmic scale to ensure consistent alignment of modular components.

- **Desktop:** 12-column grid with 24px gutters. Large 48px outer margins create the desired "whitespace-heavy" feel.
- **Mobile:** 4-column grid with 16px gutters and margins.
- **Modular Cards:** Content should be grouped into cards with 24px of internal padding to maintain a clean, airy appearance.

## Elevation & Depth
Depth is communicated through **Ambient Shadows** and **Tonal Layering**. Surfaces do not rely on heavy gradients; instead, they use flat color fills with soft, diffused shadows to indicate interactable layers.

- **Level 0 (Background):** #F9FAFB.
- **Level 1 (Cards/Modules):** White (#FFFFFF) with a `0px 4px 20px rgba(17, 24, 39, 0.05)` shadow.
- **Level 2 (Active/Hover):** White (#FFFFFF) with a `0px 10px 30px rgba(17, 24, 39, 0.08)` shadow.
- **Level 3 (Overlays/Sheets):** White (#FFFFFF) with a heavy `0px 20px 50px rgba(17, 24, 39, 0.12)` shadow.

**Glassmorphism** is reserved for status badges and floating navigation elements, using a `backdrop-filter: blur(8px)` and a semi-transparent white border (1px) to create a "technical lens" effect.

## Shapes
The shape language is strictly defined by "Subtle Roundedness." Base UI elements like input fields and buttons utilize a 0.5rem (8px) radius. Larger containers, such as modular cards and slide-over sheets, should scale up to 0.75rem (12px) or 1rem (16px) to emphasize their role as structural boundaries. This balance prevents the UI from feeling too sharp/aggressive or too "bubbly"/playful.

## Components

### Buttons
- **Primary:** Solid #FFD700 with #111827 text. Bold weight. No border.
- **Secondary:** Solid #111827 with white text. 
- **Ghost:** Transparent background with #111827 border (1px) or text only.

### Status Badges
Utilize glass-morphism. A semi-transparent background (e.g., `rgba(255, 255, 255, 0.6)`) with a 1px border matching the status color (Success/Green, Warning/Yellow, Error/Red). Apply a 4px backdrop blur.

### Steppers
For numerical targets, use a horizontal arrangement with bold "-" and "+" secondary-colored buttons flanking a large, centered value in Montserrat. The background of the stepper should be the neutral #F3F4F6 gray.

### Slide-over Sheets
Enter from the right side of the screen. These should occupy 400px–600px width. They use a Level 3 elevation shadow and a 1px border-left in #F3F4F6 to define the edge against the blurred backdrop.

### Cards
Modular white containers with Level 1 shadows. Headers within cards should use Montserrat (Headline-sm) with a thin horizontal separator (1px #F3F4F6) below the header area.

### Input Fields
Filled style using #F3F4F6. On focus, transition to a white background with a 2px #FFD700 border. Labels are always positioned above the field in Inter (Label-sm).