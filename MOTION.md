# Motion Guidelines

This document outlines the motion/animation principles for the Big-O Analyzer project.

## Principles

1. **Purposeful Motion**: Only animate things that provide user value - state changes, navigation, loading, feedback.
2. **Subtle & Smooth**: Avoid overly flashy animations. Keep transitions smooth and natural.
3. **Consistent**: Use consistent easing curves and durations across the app.
4. **Respectful**: Respect user preferences (prefers-reduced-motion).

## Easing Curves

- **Emphasized In**: `cubic-bezier(0.4, 0, 0.2, 1)` (default for most transitions)
- **Emphasized Out**: `cubic-bezier(0.8, 0, 0.2, 1)` (for things exiting the screen)
- **Linear**: `linear` (rare, only for constant animations like spinners)

## Durations

| Type | Duration |
|------|----------|
| Micro-interactions (hover, focus) | 150-200ms |
| State changes (tabs, modals) | 200-300ms |
| Page transitions | 300-400ms |
| Loading/indeterminate | 800-1500ms per cycle |

## When To Animate

| Interaction | Animation |
|-------------|-----------|
| Hover on interactive elements | Subtle background/color change (150ms) |
| Button press | Scale down slightly (100ms) |
| Tabs switching | Crossfade/slide (200ms) |
| Loading states | Skeleton shimmer (1.5s infinite) |
| Toast notifications | Slide up + fade in (300ms) |

## When NOT To Animate

- Core content on initial page load (use placeholders instead)
- Static text or elements
- Rapid, repeated interactions
