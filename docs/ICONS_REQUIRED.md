# Icons Required for Production

All icons should be generated from `/public/white_shoal.svg` as the base logo.

## Required Icon Files

### Favicon Icons
- `favicon-16x16.png` - 16x16 pixels
- `favicon-32x32.png` - 32x32 pixels  
- `favicon-48x48.png` - 48x48 pixels
- `favicon.ico` - Multi-size ICO file (16x16, 32x32, 48x48)

### Apple Touch Icons
- `apple-touch-icon-120x120.png` - 120x120 pixels
- `apple-touch-icon-152x152.png` - 152x152 pixels
- `apple-touch-icon-180x180.png` - 180x180 pixels

### PWA/Android Icons
- `icon-192x192.png` - 192x192 pixels (PWA standard)
- `icon-512x512.png` - 512x512 pixels (PWA standard)

### Additional Standard Sizes
- `icon-64x64.png` - 64x64 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-256x256.png` - 256x256 pixels

### Social Media & Open Graph
- `og-image.png` - 1200x630 pixels (OpenGraph image)
- `screenshot-desktop.png` - 1280x800 pixels (PWA screenshot)
- `screenshot-mobile.png` - 390x844 pixels (PWA screenshot)

## Design Guidelines

1. **Base Logo**: Use `white_shoal.svg` (white fill)
2. **Background**: Add dark background (#1a1b1e) for visibility
3. **Padding**: Maintain ~10-15% padding around logo
4. **Format**: PNG with transparency where possible
5. **Quality**: High-quality scaling, avoid pixelation

## Generation Process

1. Scale `white_shoal.svg` to required dimensions
2. Add appropriate background for visibility
3. Ensure logo remains crisp at all sizes
4. Test visibility on both light and dark backgrounds
5. Replace `/app/favicon.ico` with new Shoal-branded version

## Current Status
- ✅ Directory structure created
- ✅ Metadata updated in layout.tsx
- ✅ PWA manifest.json created
- ❌ Icon files need to be generated from white_shoal.svg
- ❌ favicon.ico needs to be replaced