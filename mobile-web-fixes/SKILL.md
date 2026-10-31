---
name: mobile-web-fixes
description: Apply the mobile web fixes below when reviewing or fixing touch interactions, viewport sizing, safe areas, or phone-specific rendering issues.
---

# Mobile web fixes

| Problem | Solution |
| --- | --- |
| Hover state stuck after tap | Wrap in `@media (hover: hover) and (pointer: fine)` |
| Grey/blue flash on tap | Kill `-webkit-tap-highlight-color` |
| Layout has wrong height | `100dvh` (app) or `100svh` (hero) |
| Page zooms into input | Input's font size should be 16px at the minimum |
| Tap feels laggy | Feedback on pointer-down + `touch-action: manipulation` |
| Pull-to-refresh hijacks scroll | `overscroll-behavior: none` on `html, body` |
| Content stops at the notch | `viewport-fit=cover` + `env(safe-area-inset-*)` |
| Long-press selects button text | Add `user-select: none` |
| Carousel scrolls vertically | `touch-action: pan-y` on the gesture surface |
| Status bar colour doesn't match | `theme-color` per colour scheme |
| Right in Chrome, wrong on phone | Test on real hardware! |
