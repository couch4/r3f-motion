import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFrame } from "@react-three/fiber";
import { Box3, Matrix4, PlaneGeometry, type Group, type Mesh } from "three";
import {
  animate,
  useMotionValue,
  type AnimationPlaybackControls,
  type MotionValue,
  type Transition,
} from "motion/react";
import { motion } from "../../render/motion";
import type { DragInfo } from "../../types";

const DEFAULT_SPRING: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 100,
};

// Seconds of velocity to project past the release point when snapping —
// higher value = a flick advances further.
const VELOCITY_PROJECTION = 0.2;
// Fraction of slideWidth the user must cross, or minimum velocity (world
// units/sec) required, to commit to the next slide. Below both thresholds
// the carousel snaps back to the slot the drag started on.
const DRAG_THRESHOLD_RATIO = 0.25;
const FLICK_VELOCITY = 1.0;

// Snap-spring integration. The spring is integrated inside useFrame (see the
// useFrame below) rather than handed to motion's animate() so that R3F's clock
// is the only thing driving position — animate() runs its own rAF, which puts
// every read a frame out of phase and hard-assigns the end value on complete.
//
// It integrates in *slot-index* units (1.0 = one slide). stiffness/damping/mass
// carry over from a consumer `transition` unchanged because the spring ODE is
// scale-invariant — rescaling x leaves it identical, so a spring tuned against
// pixels behaves the same here. restDelta/restSpeed are *not* scale-invariant,
// so those are fixed below in index units instead of read off the transition.
const SNAP_REST_DELTA = 0.0005; // index units
const SNAP_REST_SPEED = 0.005; // index units / sec
const SNAP_SUBSTEPS = 4;
const MAX_FRAME_DELTA = 0.05;

// World units of off-snap travel before the carousel counts as "moving" (which
// suppresses clicks). Roughly a pixel at typical camera distances.
const MOTION_EPSILON = 0.001;

// Extra slot-distance a slot must travel past the mount threshold before it
// unmounts. Without this gap a slot parked exactly on the threshold flickers
// between mounted and unmounted as the group jitters around it.
const RENDER_HYSTERESIS = 0.3;

interface SnapSpring {
  stiffness: number;
  damping: number;
  mass: number;
}

// A stiffness/damping spring is the only shape the useFrame integrator can
// reproduce. Tweens and duration/bounce springs fall back to motion's animate()
// driving currIndex, which useFrame then reads (the pre-existing behaviour).
const resolveSnapSpring = (transition: Transition): SnapSpring | null => {
  const t = transition as Record<string, unknown>;
  if (t.type !== undefined && t.type !== "spring") return null;
  if (typeof t.duration === "number") return null;
  return {
    stiffness: typeof t.stiffness === "number" ? t.stiffness : 100,
    damping: typeof t.damping === "number" ? t.damping : 10,
    mass: typeof t.mass === "number" ? t.mass : 1,
  };
};

interface SnapState {
  active: boolean;
  target: number;
  velocity: number;
}

export interface CarouselProps {
  items: ReactNode[];
  itemWidth?: number;
  gap?: number;
  defaultValue?: number;
  transition?: Transition;
  onSwitch?: (index: number) => void;
  onDragStart?: () => void;
  onDrag?: (info: DragInfo) => void;
  onDragEnd?: (info: DragInfo) => void;
  renderThreshold?: number;
  dragThreshold?: number;
  flickVelocity?: number;
  disable?: boolean;
  /**
   * Capture drags on a single hit-target owned by the parent group instead of
   * one per slot (default `true`).
   *
   * Either way a pointerdown on your own content starts a drag — R3F bubbles it
   * up the Object3D parent chain to the group `useDrag` is attached to. The
   * hit-target only exists to catch the *gaps* your content doesn't cover.
   *
   * With `true` that's one plane spanning the looped strip, sized vertically to
   * the measured content bounds and placed behind the content. With `false`
   * it's the legacy per-slot cover, which sits in *front* of the content and so
   * intercepts hover/click on your items.
   */
  dragOnParent?: boolean;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

export interface CarouselSlotInfo {
  slotIndex: number;
  itemIndex: number;
  // Fractional slot index, driven by useFrame. Read it in a child's own
  // useFrame for per-frame effects tied to carousel position.
  currIndex: MotionValue<number>;
  // Physical-slot distance from the active slot, wrapped (0 = active).
  distance: number;
  isActive: boolean;
  isNearby: boolean;
}

const CarouselSlotContext = createContext<CarouselSlotInfo | null>(null);

export const useCarouselSlot = (): CarouselSlotInfo => {
  const ctx = useContext(CarouselSlotContext);
  if (!ctx) throw new Error("useCarouselSlot must be used inside <Carousel>");
  return ctx;
};

interface SlotProps {
  item: ReactNode;
  itemWidth: number;
  slotRef: (el: Group | null) => void;
  visible: boolean;
  // When false the parent group owns the drag hit-target, so the slot renders
  // content only — no cover mesh and no per-slot measurement pass.
  cover: boolean;
}

const CarouselSlot = memo(
  ({ item, itemWidth, slotRef, visible, cover }: SlotProps) => {
    const contentRef = useRef<Group>(null);
    const coverRef = useRef<Mesh>(null);

    useLayoutEffect(() => {
      const content = contentRef.current;
      const coverMesh = coverRef.current;
      if (!content || !coverMesh) return;
      const box = new Box3().setFromObject(content);
      if (box.isEmpty()) return;
      const w = Math.max(box.max.x - box.min.x, itemWidth);
      const h = box.max.y - box.min.y;
      coverMesh.geometry.dispose();
      coverMesh.geometry = new PlaneGeometry(w, h);
      coverMesh.position.set(
        (box.max.x + box.min.x) / 2,
        (box.max.y + box.min.y) / 2,
        box.max.z + 0.001,
      );
    }, [itemWidth, cover]);

    // Dispose the generated geometry on unmount — useLayoutEffect's replacement
    // logic only disposes the *previous* geometry, not the final one.
    useEffect(
      () => () => {
        coverRef.current?.geometry.dispose();
      },
      [],
    );

    // No onClick on the cover — the carousel's document-level capture listener
    // handles click suppression. The cover is the drag hit-target for slot
    // regions where user content has gaps, and is only rendered when the parent
    // group isn't providing one of its own.
    return (
      <group ref={slotRef}>
        <group ref={contentRef}>{visible ? item : null}</group>
        {cover ? (
          <mesh ref={coverRef}>
            <planeGeometry args={[itemWidth, itemWidth]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        ) : null}
      </group>
    );
  },
);

const Carousel = ({
  items,
  itemWidth = 1.5,
  gap = 0.5,
  defaultValue = 0,
  transition = DEFAULT_SPRING,
  onSwitch,
  onDragStart,
  onDrag,
  onDragEnd,
  renderThreshold,
  dragThreshold = DRAG_THRESHOLD_RATIO,
  flickVelocity = FLICK_VELOCITY,
  disable,
  dragOnParent = true,
  ...props
}: CarouselProps) => {
  const slideWidth = itemWidth + gap;
  const count = items.length;

  // Render twice the items and center on the first item of the second copy.
  // The first copy lives to the left, so wrap-points sit at ±N*slideWidth
  // from camera center — well off-screen — instead of ±N*slideWidth/2
  // where they'd pop in and out at the visible edges.
  const loopedItems = useMemo(() => [...items, ...items], [items]);
  const slotCount = loopedItems.length;
  const period = slotCount * slideWidth;
  const startSlot = count + defaultValue;

  const groupRef = useRef<Group>(null);
  const itemRefs = useRef<(Group | null)[]>([]);
  const catcherRef = useRef<Mesh>(null);
  // Last geometry the catcher was built with, so re-measuring on a slot
  // mount/unmount doesn't churn a new PlaneGeometry when nothing changed.
  const catcherSizeRef = useRef<{ w: number; h: number } | null>(null);
  const hasCatcher = dragOnParent && !disable;

  // Slot mount/unmount state — mirrors `ref.visible` but propagates through
  // React so children that rely on lifecycle (e.g. Drei's <Html>, which
  // doesn't reliably react to mid-frame `visible` mutations) update cleanly.
  // Only flips when a slot crosses the threshold, so re-renders are limited
  // to ~2-4 per swipe instead of every frame.
  const [visibleMask, setVisibleMask] = useState<boolean[]>(() => {
    if (renderThreshold === undefined) return new Array(slotCount).fill(true);
    const mask = new Array(slotCount).fill(false);
    for (let i = 0; i < slotCount; i++) {
      mask[i] = Math.abs(i - startSlot) <= renderThreshold + 0.5;
    }
    return mask;
  });
  const visibleMaskRef = useRef(visibleMask);
  visibleMaskRef.current = visibleMask;

  // Single source of truth: a fractional slot index that grows up/down
  // infinitely as the user navigates. group.position.x = -currIndex * slideWidth
  // at rest. useFrame is what advances it — the snap spring integrates into it,
  // and a drag jumps it to match the position use-drag wrote — so the public
  // MotionValue and the rendered position never disagree by a frame.
  const currIndex = useMotionValue(startSlot);
  const isDraggingRef = useRef(false);
  const dragStartIndexRef = useRef(startSlot);
  // Physics state for the snap spring, integrated in useFrame.
  const snapRef = useRef<SnapState>({
    active: false,
    target: startSlot,
    velocity: 0,
  });
  // Only used on the animate() fallback path (non-spring transitions).
  const snapAnimRef = useRef<AnimationPlaybackControls | null>(null);
  const snapSpring = useMemo(() => resolveSnapSpring(transition), [transition]);
  // True while the carousel is dragging or off-snap. Per-instance (not module
  // scope) so two carousels on one page don't fight over click suppression.
  const isMovingRef = useRef(false);

  // Wrapped physical slot index (0..slotCount-1) — drives per-slot context so
  // children can read isActive/distance without the consumer having to lift
  // state. Updates the moment a snap commits, not while dragging.
  const [currentSlot, setCurrentSlot] = useState(() =>
    mod(startSlot, slotCount),
  );

  const initial = useMemo(
    () => ({ x: -startSlot * slideWidth }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Stable per-index ref callbacks. An inline `(el) => ...` is a fresh identity
  // every render, which makes CarouselSlot's memo() never bail and re-renders
  // all 2N slots on every visibility/slot state change.
  const slotRefs = useMemo(
    () =>
      Array.from({ length: slotCount }, (_, i) => (el: Group | null) => {
        itemRefs.current[i] = el;
      }),
    [slotCount],
  );

  // Likewise for the per-slot context values: a fresh object literal per render
  // would re-render every useCarouselSlot() consumer on each visibility flip,
  // straight past CarouselSlot's memo. These only actually change when the
  // active slot does.
  const slotContexts = useMemo(
    () =>
      Array.from({ length: slotCount }, (_, i) => {
        const raw = i - currentSlot;
        const halfWrap =
          (((raw + slotCount / 2) % slotCount) + slotCount) % slotCount;
        const distance = Math.abs(halfWrap - slotCount / 2);
        return {
          slotIndex: i,
          itemIndex: i % count,
          distance,
          isActive: distance === 0,
          isNearby: distance <= 1,
          currIndex,
        } satisfies CarouselSlotInfo;
      }),
    [slotCount, currentSlot, count, currIndex],
  );

  // `velocity` is in slot-index units/sec and seeds the spring so a flick keeps
  // its momentum through the handoff from drag to snap instead of restarting
  // from rest.
  const goTo = useCallback(
    (slot: number, velocity = 0) => {
      onSwitch?.(mod(slot, count));
      setCurrentSlot(mod(slot, slotCount));
      snapAnimRef.current?.stop();
      snapAnimRef.current = null;
      if (snapSpring) {
        snapRef.current = { active: true, target: slot, velocity };
      } else {
        snapRef.current.active = false;
        snapAnimRef.current = animate(currIndex, slot, transition);
      }
    },
    [count, slotCount, transition, onSwitch, currIndex, snapSpring],
  );

  useEffect(() => () => snapAnimRef.current?.stop(), []);

  // Size the parent drag catcher from the measured content bounds.
  //
  // Width is analytic rather than measured: the slots' x positions wrap every
  // frame and only a few are mounted under `renderThreshold`, so a measured x
  // extent would be both unstable and too small. `period` is the full looped
  // strip, which is what the row spans. Height/centre come from the mounted
  // content, so the catcher hugs the row and leaves the rest of the scene
  // clickable. Z sits behind the content so slot content keeps its own pointer
  // events (unlike the legacy per-slot cover, which sits in front).
  useLayoutEffect(() => {
    const catcher = catcherRef.current;
    const group = groupRef.current;
    if (!catcher) return;

    // setFromObject assumes ancestors are current and returns world-space
    // bounds; refresh the tree, then pull them back into group-local space
    // since that's where the catcher's own transform lives.
    group?.updateWorldMatrix(true, true);
    const bounds = new Box3();
    const slotBounds = new Box3();
    for (const slot of itemRefs.current) {
      if (!slot) continue;
      slotBounds.setFromObject(slot);
      if (!slotBounds.isEmpty()) bounds.union(slotBounds);
    }
    if (group && !bounds.isEmpty()) {
      bounds.applyMatrix4(new Matrix4().copy(group.matrixWorld).invert());
    }

    const empty = bounds.isEmpty();
    const w = period;
    const h = empty ? itemWidth : bounds.max.y - bounds.min.y;

    // Only rebuild when the size actually changed — this effect re-runs on
    // every slot mount/unmount so the height settles once real content lands.
    const last = catcherSizeRef.current;
    if (!last || last.w !== w || last.h !== h) {
      catcher.geometry.dispose();
      catcher.geometry = new PlaneGeometry(w, h);
      catcherSizeRef.current = { w, h };
    }
    catcher.position.y = empty ? 0 : (bounds.max.y + bounds.min.y) / 2;
    catcher.position.z = empty ? -0.001 : bounds.min.z - 0.001;
  }, [hasCatcher, items, itemWidth, period, visibleMask]);

  // Same reasoning as the slot covers — dispose the last generated geometry,
  // which the rebuild path above never gets to.
  useEffect(
    () => () => {
      catcherRef.current?.geometry.dispose();
      catcherSizeRef.current = null;
    },
    [],
  );

  // Document-level capture click listener — fires before R3F's listener (and
  // any descendant DOM handlers) anywhere in the tree. While the carousel is
  // moving (or just settled), swallow the event so it never reaches user
  // content (R3F meshes or HTML portaled by Drei). No-op outside the cooldown
  // window, so true taps propagate normally.
  useEffect(() => {
    const onClickCapture = (e: Event) => {
      if (isMovingRef.current) {
        e.stopImmediatePropagation();
        e.stopPropagation();
      }
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, []);

  // Drag start: stop any in-flight snap and capture the slot we started on
  // so an under-threshold release can elastic back to it.
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    dragStartIndexRef.current = Math.round(currIndex.get());
    snapRef.current.active = false;
    snapAnimRef.current?.stop();
    snapAnimRef.current = null;
    onDragStart?.();
  }, [currIndex, onDragStart]);

  const handleDragEnd = useCallback(
    (_: PointerEvent, info: DragInfo) => {
      isDraggingRef.current = false;
      const group = groupRef.current;

      if (group) {
        // Resync the motion value to where use-drag actually locked the
        // position — the next useFrame integrates from this same value, so
        // there's no visible jump between the dragged position and the snap.
        const releasedX = group.position.x;
        const releasedIndex = -releasedX / slideWidth;
        currIndex.jump(releasedIndex);

        // World units/sec → slot-index units/sec. group.position.x runs
        // opposite to the index, hence the sign flip.
        const indexVelocity = -info.velocity.x / slideWidth;

        const startIndex = dragStartIndexRef.current;
        const offsetIndex = releasedIndex - startIndex;
        const overThreshold = Math.abs(offsetIndex) > dragThreshold;
        const overVelocity = Math.abs(info.velocity.x) > flickVelocity;

        if (!overThreshold && !overVelocity) {
          goTo(startIndex, indexVelocity);
        } else {
          const projectedX = releasedX + info.velocity.x * VELOCITY_PROJECTION;
          goTo(Math.round(-projectedX / slideWidth), indexVelocity);
        }
      }

      // Fires on every release, including a sub-threshold snap-back — consumers
      // pair it with onDragStart to track "is the user interacting", so
      // skipping it on any path latches that flag on permanently.
      onDragEnd?.(info);
    },
    [slideWidth, goTo, currIndex, dragThreshold, flickVelocity, onDragEnd],
  );

  // The single writer of group.position.x outside of a drag. Drag, snap and
  // slot layout all advance on R3F's clock here, so nothing reads a value that
  // another scheduler wrote half a frame ago.
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (isDraggingRef.current) {
      // use-drag owns group.position.x while the pointer is down; mirror it
      // into currIndex so the public slot context and a snap starting next
      // frame both read from one source.
      currIndex.jump(-group.position.x / slideWidth);
    } else {
      const snap = snapRef.current;
      if (snap.active && snapSpring) {
        // Semi-implicit Euler, sub-stepped for stability with stiff springs.
        let dt = Math.min(delta, MAX_FRAME_DELTA);
        if (dt <= 0) dt = 1 / 60;
        const subDt = dt / SNAP_SUBSTEPS;
        let index = currIndex.get();
        for (let i = 0; i < SNAP_SUBSTEPS; i++) {
          const force =
            (-snapSpring.stiffness * (index - snap.target) -
              snapSpring.damping * snap.velocity) /
            snapSpring.mass;
          snap.velocity += force * subDt;
          index += snap.velocity * subDt;
        }
        if (
          Math.abs(snap.velocity) < SNAP_REST_SPEED &&
          Math.abs(index - snap.target) < SNAP_REST_DELTA
        ) {
          index = snap.target;
          snap.velocity = 0;
          snap.active = false;
        }
        currIndex.jump(index);
      }
      group.position.x = -currIndex.get() * slideWidth;
    }

    const groupX = group.position.x;

    // The group translates without bound (currIndex grows forever), so the
    // catcher has to be pinned back to the carousel's rest centre every frame
    // the same way slots wrap — otherwise it drifts off-screen after enough
    // swipes and stops catching anything.
    const catcher = catcherRef.current;
    if (catcher) catcher.position.x = -groupX;

    const snapDelta = Math.abs(
      groupX - Math.round(groupX / slideWidth) * slideWidth,
    );
    // Assigned unconditionally — only updating it while moving would leave it
    // latched true after the snap settles, suppressing every later tap.
    isMovingRef.current = isDraggingRef.current || snapDelta > MOTION_EPSILON;

    // +0.5 margin so the leading-edge slot mounts the moment the trailing one
    // unmounts — keeps the loop seamless mid-drag instead of waiting for the
    // snap to settle on an integer slot. Unmounting uses a wider distance than
    // mounting so a slot resting on the boundary can't thrash.
    const mountDist =
      renderThreshold === undefined ? Infinity : renderThreshold + 0.5;
    const unmountDist = mountDist + RENDER_HYSTERESIS;

    let nextMask: boolean[] | null = null;
    for (let i = 0; i < slotCount; i++) {
      const ref = itemRefs.current[i];
      if (!ref) continue;
      const k = Math.round((-groupX - i * slideWidth) / period);
      ref.position.x = i * slideWidth + k * period;
      const slotDist = Math.abs((groupX + ref.position.x) / slideWidth);
      const wasVisible = visibleMaskRef.current[i] ?? false;
      const shouldBeVisible = wasVisible
        ? slotDist <= unmountDist
        : slotDist <= mountDist;
      ref.visible = shouldBeVisible;
      if (wasVisible !== shouldBeVisible) {
        if (!nextMask) nextMask = visibleMaskRef.current.slice();
        nextMask[i] = shouldBeVisible;
      }
    }
    if (nextMask) {
      visibleMaskRef.current = nextMask;
      setVisibleMask(nextMask);
    }
  });

  return (
    <motion.group
      ref={groupRef}
      drag={disable ? false : "x"}
      dragMomentum={false}
      initial={initial}
      {...props}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrag={(_e: PointerEvent, info: DragInfo) => onDrag?.(info)}
    >
      {hasCatcher ? (
        <mesh ref={catcherRef}>
          <planeGeometry args={[period, itemWidth]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
      {loopedItems.map((item, i) => (
        <CarouselSlotContext.Provider
          key={`carouselItem-${i}`}
          value={slotContexts[i]}
        >
          <CarouselSlot
            item={item}
            itemWidth={itemWidth}
            slotRef={slotRefs[i]}
            visible={visibleMask[i] ?? false}
            cover={!dragOnParent}
          />
        </CarouselSlotContext.Provider>
      ))}
    </motion.group>
  );
};

export default memo(Carousel) as typeof Carousel;
