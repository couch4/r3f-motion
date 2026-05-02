# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`r3f-motion` is a React 19 drop-in replacement for the deprecated `framer-motion-3d`. It provides motion/animation capabilities for `@react-three/fiber` components using the `motion` package (formerly Framer Motion) under the hood. It does **not** use motion's visual element system — instead it directly mutates Three.js object properties via `motion`'s imperative `animate()` function.

## Commands

```bash
# Development
bun run dev          # Watch mode (tsc + rollup in parallel)
bun run storybook    # Storybook dev server on port 6006

# Build
bun run build        # Full build: tsc → lib/, rollup → dist/
bun run clean        # Remove types/, dist/, lib/

# Testing
bun test                          # Run all tests
bun test -- -t "test name"        # Run a single test by name
bun run test:coverage             # Coverage report

# Quality
bun run lint
bun run prettier
```

The build pipeline is two-stage: TypeScript compiles source to `lib/`, then Rollup bundles `lib/` into `dist/` (CJS + ESM + `.d.ts`).

## Architecture

### Core Animation (`src/render/motion.ts`)

The exported `motion` object is a `Proxy` over a `custom()` factory. Accessing `motion.mesh`, `motion.group`, etc. lazily creates (and caches) a `memo`+`forwardRef` component for that R3F element type.

Inside each generated component, animation is driven by React `useEffect`s watching the `animate` and `presenceContext.isPresent` props. When they change, `animateToTarget()` is called, which uses `motion`'s imperative `animate()` to directly mutate Three.js instance properties.

**Property mapping** (the key translation layer):
| Prop | Three.js target |
|------|----------------|
| `x/y/z` | `instance.position.x/y/z` |
| `rotateX/Y/Z` | `instance.rotation.x/y/z` |
| `scale` | `instance.scale.x/y/z` (all three axes) |
| `scaleX/Y/Z` | `instance.scale.x/y/z` (individual) |
| `color`, `emissive`, etc. | animated as RGB channels on the Three.js Color object |
| ShaderMaterial uniforms | `instance.uniforms[key].value` (numeric only; consumers must `useMemo` their uniforms to prevent R3F from overwriting animated values on re-render) |
| Other numeric props | `instance[key]` directly |

### Rendering (`src/render/use-render.ts`)

Uses a callback ref to capture the Three.js instance. On first mount, `initial` values are applied synchronously before the frame paints to prevent flash-of-unstyled-content. The instance is stored in `instanceRef` so `animateToTarget` can access it imperatively.

### Variant Inheritance (`MotionContext`)

`motion.ts` provides a `MotionContext` React context. Parent components propagate `initial`, `animate`, `variants`, `transition`, and `custom` downward. Child components (via `inherit = true` default) pick these up, enabling variant strings like `"visible"` to resolve without each child needing its own `variants` prop. Stagger/delay orchestration is calculated manually: children register their index via `getNextChildIndex()` from the parent context, and the final delay is `delayChildren + childIndex * staggerChildren`.

### Gestures (`src/render/gestures/`)

`useHover` and `useTap` hooks wrap R3F pointer events (`onPointerEnter/Leave`, `onPointerDown/Up/Cancel`). On gesture start, they capture the current Three.js state and animate to the `whileHover`/`whileTap` target. On gesture end, they restore the captured pre-gesture state.

### AnimatePresence (`src/components/AnimatePresence/`)

A custom implementation (not re-exported from `motion/react`). Tracks child keys in local state, marks departing children as `isPresent: false` via `PresenceContext`, and waits for the child to call `safeToRemove()` before unmounting. Supports `mode="wait"` (exit completes before enter) and `mode="sync"` (default).

### Animation Callbacks (`src/render/events/index.ts`)

`onAnimationStart`, `onAnimationUpdate`, and `onAnimationComplete` are normalized internally. Because one logical animation fans out into multiple `animate()` calls (one per property axis), `AnimationState` tracks a count of registered animations vs. completions, firing `onAnimationComplete` only when all sub-animations finish.

## Public API

```ts
import { motion, AnimatePresence, MotionCamera, usePresence } from "r3f-motion";
```

- **`motion.*`** — animated R3F element (e.g. `motion.mesh`, `motion.group`)
- **`AnimatePresence`** — mounts/unmounts children with exit animations
- **`MotionCamera`** — animated perspective/orthographic camera
- **`usePresence`** — access `PresenceContext` to manually signal exit completion
