# Ozon Calculator Design Direction

This UI uses `vendor/awesome-design-md` as its reference library.

Primary inspiration:
- `design-md/apple/DESIGN.md`: premium white space, SF Pro-like system typography, cinematic product-like visual panels, Action Blue links and CTAs.

## Visual Theme

The product should feel like a premium Apple-style pricing studio for cross-border sellers: calm, precise, spacious, and polished. Use generous white space, pearl surfaces, dark cinematic result panels only where they help the page feel product-grade, and blue text/button actions.

## Colors

- Canvas: `#ffffff`
- Canvas secondary: `#f5f5f7`
- Ink: `#1d1d1f`
- Muted ink: `#6e6e73`
- Hairline: `rgba(29, 29, 31, 0.12)`
- Action blue: `#0066cc`
- Action blue hover: `#0071e3`
- Blue on dark: `#2997ff`
- Dark tile: `#1d1d1f`
- Success: `#248a3d`
- Danger: `#d70015`
- Warning: `#bf5b00`

## Components

- Cards use white or pearl surfaces, soft 18-24px radii, hairline borders, and minimal shadow.
- Primary buttons use Apple Action Blue pill shapes with white text.
- Secondary buttons are blue text or pale blue capsules.
- Inputs use white surfaces, 12px radii, and blue focus rings.
- Hero/result visual panels may use cinematic dark surfaces with a product-like abstract device form.

## Layout

- Mobile remains single-column.
- Desktop keeps a left input rail and right result rail, but with more breathing room.
- Results should prioritize chargeable weight, recommended plan, profit, and target price.
- Numeric values use SF-like system typography and tabular spacing where possible.

## Guardrails

- Do not return to the old blue-gradient SaaS palette.
- Do not use lime/green fintech CTAs in the Apple theme.
- Do not add decorative gradients, blobs, or noisy backgrounds.
- Keep touch targets generous and rounded.
- Keep data calm, readable, and premium; avoid nested cards inside cards.
