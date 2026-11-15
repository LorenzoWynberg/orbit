---
version: "alpha"
name: "Orbit"
description: "Orbit as the GitHub Pages · Chrome Web Store codebase renders it, from the manifest root /orbit/apps/web."
packageId: "7362c460-1772-5136-895f-b25825cbba42"
omitted:
  - section: "components"
    reason: "Trinity settles token axes, never component recipes — a button, a chip and an input are built from the roles and scales this document states, so there is no component token set to write down."
colors:
  background: "oklch(0.985 0.004 250)"
  surface: "oklch(0.965 0.006 250)"
  elevated: "oklch(1 0 0)"
  foreground: "oklch(0.22 0.02 255)"
  muted: "oklch(0.47 0.02 255)"
  primary: "oklch(0.48 0.17 260)"
  on-primary: "oklch(0.99 0.003 250)"
  secondary: "oklch(0.52 0.04 255)"
  on-secondary: "oklch(0.99 0.003 250)"
  accent: "oklch(0.6 0.15 50)"
  on-accent: "oklch(0.18 0.03 50)"
  danger: "oklch(0.52 0.19 25)"
  on-danger: "oklch(0.99 0.003 250)"
  warning: "oklch(0.62 0.13 70)"
  on-warning: "oklch(0.2 0.03 70)"
  success: "oklch(0.52 0.13 150)"
  on-success: "oklch(0.99 0.003 250)"
  info: "oklch(0.52 0.1 230)"
  on-info: "oklch(0.99 0.003 250)"
  border: "oklch(0.9 0.008 250)"
  input: "oklch(0.88 0.01 250)"
  ring: "oklch(0.55 0.17 260)"
  dark-background: "oklch(0.17 0.012 255)"
  dark-surface: "oklch(0.21 0.014 255)"
  dark-elevated: "oklch(0.25 0.015 255)"
  dark-foreground: "oklch(0.95 0.006 250)"
  dark-muted: "oklch(0.72 0.02 255)"
  dark-primary: "oklch(0.72 0.14 260)"
  dark-on-primary: "oklch(0.17 0.03 260)"
  dark-secondary: "oklch(0.6 0.03 255)"
  dark-on-secondary: "oklch(0.15 0.01 255)"
  dark-accent: "oklch(0.74 0.14 55)"
  dark-on-accent: "oklch(0.18 0.03 55)"
  dark-danger: "oklch(0.68 0.17 25)"
  dark-on-danger: "oklch(0.17 0.03 25)"
  dark-warning: "oklch(0.8 0.14 80)"
  dark-on-warning: "oklch(0.2 0.03 80)"
  dark-success: "oklch(0.72 0.14 150)"
  dark-on-success: "oklch(0.17 0.03 150)"
  dark-info: "oklch(0.72 0.11 230)"
  dark-on-info: "oklch(0.17 0.03 230)"
  dark-border: "oklch(0.3 0.015 255)"
  dark-input: "oklch(0.33 0.015 255)"
  dark-ring: "oklch(0.72 0.14 260)"
typography:
  display:
    fontFamily: "Inter"
  body:
    fontFamily: "Inter"
  mono:
    fontFamily: "JetBrains Mono"
  xs:
    fontSize: "0.75rem"
  sm:
    fontSize: "0.875rem"
  base:
    fontSize: "1rem"
  lg:
    fontSize: "1.125rem"
  xl:
    fontSize: "1.25rem"
  2xl:
    fontSize: "1.5rem"
  3xl:
    fontSize: "1.875rem"
  4xl:
    fontSize: "2.25rem"
  leading-tight:
    lineHeight: 1.2
  leading-snug:
    lineHeight: 1.35
  leading-normal:
    lineHeight: 1.5
  leading-relaxed:
    lineHeight: 1.65
rounded:
  lg: "0.375rem"
spacing:
  base: "0.25rem"
---

# Orbit — GitHub Pages · Chrome Web Store

## Overview

Design system **Orbit** ships one theme, on a light facet and a dark one.

Trinity renders this file from a design revision a story applies. The values below ARE
that revision. A later story applying a changed revision shows the difference against
this file in its pull request, so a hand edit here is reconciled there rather than
overwritten.

Every block below carries the colour roles, the `--elevation-*` elevation scale, the `--radius*` shape scale, the `--spacing*`/`--text-*`/`--leading-*` density scale, and the `--duration-*`/`--ease-*` motion scale.

Design intent no token axis expresses. Honour it alongside the tokens below; it never
overrides or contradicts one.

Posture: a single-purpose instrument. One converter on screen, no marketing chrome; the Chrome extension popup is the same converter at popup width. The result value is the one emphasised element. The CLI keeps stdout plain for piping and uses the palette only on stderr (errors in the danger role) and in --list headings.

## Colors

Every surface, mark and state colours off a NAMED ROLE rather than off a literal — a
role is what lets a facet change underneath a component without the component knowing.

Light:

```css
--background: oklch(0.985 0.004 250);
--surface: oklch(0.965 0.006 250);
--elevated: oklch(1 0 0);
--foreground: oklch(0.22 0.02 255);
--muted: oklch(0.47 0.02 255);
--primary: oklch(0.48 0.17 260);
--on-primary: oklch(0.99 0.003 250);
--secondary: oklch(0.52 0.04 255);
--on-secondary: oklch(0.99 0.003 250);
--accent: oklch(0.6 0.15 50);
--on-accent: oklch(0.18 0.03 50);
--danger: oklch(0.52 0.19 25);
--on-danger: oklch(0.99 0.003 250);
--warning: oklch(0.62 0.13 70);
--on-warning: oklch(0.2 0.03 70);
--success: oklch(0.52 0.13 150);
--on-success: oklch(0.99 0.003 250);
--info: oklch(0.52 0.1 230);
--on-info: oklch(0.99 0.003 250);
--border: oklch(0.9 0.008 250);
--input: oklch(0.88 0.01 250);
--ring: oklch(0.55 0.17 260);
```

Dark:

```css
--background: oklch(0.17 0.012 255);
--surface: oklch(0.21 0.014 255);
--elevated: oklch(0.25 0.015 255);
--foreground: oklch(0.95 0.006 250);
--muted: oklch(0.72 0.02 255);
--primary: oklch(0.72 0.14 260);
--on-primary: oklch(0.17 0.03 260);
--secondary: oklch(0.6 0.03 255);
--on-secondary: oklch(0.15 0.01 255);
--accent: oklch(0.74 0.14 55);
--on-accent: oklch(0.18 0.03 55);
--danger: oklch(0.68 0.17 25);
--on-danger: oklch(0.17 0.03 25);
--warning: oklch(0.8 0.14 80);
--on-warning: oklch(0.2 0.03 80);
--success: oklch(0.72 0.14 150);
--on-success: oklch(0.17 0.03 150);
--info: oklch(0.72 0.11 230);
--on-info: oklch(0.17 0.03 230);
--border: oklch(0.3 0.015 255);
--input: oklch(0.33 0.015 255);
--ring: oklch(0.72 0.14 260);
```

## Typography

A theme's families are named rather than embedded; load them however this codebase
loads fonts, always with a safe system fallback after the named family. Set every
`font-size` off `var(--text-*)`, paired with the matching `var(--leading-*)` line
height.

Families — display Inter, body Inter, mono JetBrains Mono.

```css
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
--text-4xl: 2.25rem;
--leading-tight: 1.2;
--leading-snug: 1.35;
--leading-normal: 1.5;
--leading-relaxed: 1.65;
```

## Layout

Spacing is one base unit with a ladder derived from it, so a layout tightens or loosens
from a single value. Take every padding, margin and gap off `var(--spacing*)` rather
than from a raw length.

```css
--spacing: 0.25rem;
--spacing-1: calc(var(--spacing) * 1);
--spacing-2: calc(var(--spacing) * 2);
--spacing-3: calc(var(--spacing) * 3);
--spacing-4: calc(var(--spacing) * 4);
--spacing-6: calc(var(--spacing) * 6);
--spacing-8: calc(var(--spacing) * 8);
--spacing-12: calc(var(--spacing) * 12);
```

## Elevation & Depth

Depth is carried by named scales, never by an ad-hoc shadow: every raised surface takes
its `box-shadow` from a step of the scale below, at the value that step holds on the
ground the surface sits on.

Light, carrying elevation:

```css
--elevation-2xs: 0 1px rgb(0 0 0 / 0.04);
--elevation-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--elevation-sm: 0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08);
--elevation-md: 0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08);
--elevation-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08);
--elevation-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08);
--elevation-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.2);
```

Dark, carrying elevation:

```css
--elevation-2xs: 0 0 0 1px rgb(0 0 0 / 0.3);
--elevation-xs: 0 0 2px 0 rgb(0 0 0 / 0.35);
--elevation-sm: 0 1px 4px 0 rgb(0 0 0 / 0.4);
--elevation-md: 0 2px 10px 0 rgb(0 0 0 / 0.45);
--elevation-lg: 0 4px 18px 1px rgb(0 0 0 / 0.5);
--elevation-xl: 0 6px 28px 2px rgb(0 0 0 / 0.55);
--elevation-2xl: 0 10px 44px 4px rgb(0 0 0 / 0.65);
```

## Shapes

One corner-radius base with a scale derived around it — take every `border-radius` off
`var(--radius*)` so the whole shape language moves with the base.

```css
--radius: 0.375rem;
--radius-sm: calc(var(--radius) - 4px);
--radius-md: calc(var(--radius) - 2px);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
--radius-2xl: calc(var(--radius) + 8px);
--radius-3xl: calc(var(--radius) + 12px);
--radius-4xl: calc(var(--radius) + 16px);
```

## Do's and Don'ts

- Do drive every styled property off these tokens — colour off `var(--role)`, every depth `box-shadow` off `var(--elevation-*)`, every `border-radius` off `var(--radius*)`, every padding, margin and gap off `var(--spacing*)`, every `font-size` off `var(--text-*)` paired with the matching `var(--leading-*)` `line-height`, and every transition/animation off `var(--duration-*)` paired with the matching `var(--ease-*)`.
- Do not hardcode a value a token covers. A literal is a value the design can no longer
  move.
- Do give every named font family a safe system fallback after it.
- Do reconcile a hand edit to these values with the next design revision a story applies,
  which shows its difference in the pull request.

## Motion

One scale per theme, read the same on every ground. Take every transition and animation
off `var(--duration-*)`, paired with the matching `var(--ease-*)`.

```css
--duration-fast: 120ms;
--duration-base: 180ms;
--duration-slow: 240ms;
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-entrance: cubic-bezier(0, 0, 0.2, 1);
--ease-exit: cubic-bezier(0.4, 0, 1, 1);
```
