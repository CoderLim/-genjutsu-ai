# Genjutsu AI / Brandfetch assets

This directory contains the recommended self-contained SVG assets for Brandfetch.

- `genjutsu-main-logo.svg`: horizontal lockup for light backgrounds, with dark outlined text and gold "AI".
- `genjutsu-light-logo.svg`: horizontal lockup for dark backgrounds, with white outlined text and warm-gold "AI".
- `genjutsu-main-symbol.svg`: standalone gold eye mark.
- `genjutsu-light-symbol.svg`: white monochrome vector eye mark for dark backgrounds.

The main logo, light logo and main symbol use the official embedded PNG eye from `public/logo.svg`, preserving the live-site identity. The light symbol is a simplified white vector interpretation for dark backgrounds. The horizontal wordmark letters are SVG vector paths; the eye inside each SVG is embedded raster content, not fully vector artwork.

The existing source assets remain at `public/logo.svg`, `public/logo.webp` and `public/logo.png`. If PNG is required, `public/logo.png` can serve as a standalone symbol, or rasterize these SVGs for logo PNGs.

The extra high-resolution reimagining from the original design kit was intentionally not deployed here because it changes the icon.
