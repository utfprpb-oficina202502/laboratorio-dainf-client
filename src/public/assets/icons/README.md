# PWA Icons

This directory contains Progressive Web App (PWA) icons in multiple sizes.

## Current Status

- **Development**: SVG placeholder icons generated
- **Production**: Convert to PNG using actual UTFPR/DAINF logo

## Icon Sizes

- 72x72px
- 96x96px
- 128x128px
- 144x144px
- 152x152px
- 192x192px
- 384x384px
- 512x512px

## Maskable Icons

All icons follow the maskable icon standard with a safe zone:

- Safe zone: 80% of icon size, centered
- Logo/content must fit within safe zone
- Background: Theme color (#1976d2)

## Production Conversion

### Option 1: Online Tools

1. Visit https://cloudconvert.com/svg-to-png
2. Upload SVG files
3. Set quality to maximum
4. Download PNG files

### Option 2: Sharp Library (Recommended)

```bash
npm install --save-dev sharp
node scripts/convert-icons-to-png.js
```

### Option 3: Design Tools

Export from Figma, Sketch, or Adobe Illustrator at each required size.

## Testing

Test icons at https://maskable.app/ to ensure they work on all platforms.
