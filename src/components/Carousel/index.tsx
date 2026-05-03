import { createContext, memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box3, PlaneGeometry, type Group, type Mesh } from 'three'
import { animate, useMotionValue, type AnimationPlaybackControls, type Transition } from 'motion/react'
import { motion } from '../../render/motion'
import type { DragInfo } from '../../types'

const DEFAULT_SPRING: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 100,
  restDelta: 0.001,
}

// Seconds of velocity to project past the release point when snapping —
// higher value = a flick advances further.
const VELOCITY_PROJECTION = 0.2
// Fraction of slideWidth the user must cross, or minimum velocity (world
// units/sec) required, to commit to the next slide. Below both thresholds
// the carousel snaps back to the slot the drag started on.
const DRAG_THRESHOLD_RATIO = 0.25
const FLICK_VELOCITY = 1.0


export interface CarouselProps {
  items: ReactNode[]
  itemWidth?: number
  gap?: number
  defaultValue?: number
  transition?: Transition
  onSwitch?: (index: number) => void
  onDragStart?: () => void
  onDrag?: (info: DragInfo) => void
  onDragEnd?: (info: DragInfo) => void
  renderThreshold?: number
  dragThreshold?: number
  flickVelocity?: number
}

const mod = (n: number, m: number) => ((n % m) + m) % m
let isDragging = false

export interface CarouselSlotInfo {
  slotIndex: number
  itemIndex: number
  currIndex: ReturnType<typeof useMotionValue>
  // Physical-slot distance from the active slot, wrapped (0 = active).
  distance: number
  isActive: boolean
  isNearby: boolean
}

const CarouselSlotContext = createContext<CarouselSlotInfo | null>(null)

export const useCarouselSlot = (): CarouselSlotInfo => {
  const ctx = useContext(CarouselSlotContext)
  if (!ctx) throw new Error('useCarouselSlot must be used inside <Carousel>')
  return ctx
}

interface SlotProps {
  item: ReactNode
  itemWidth: number
  slotRef: (el: Group | null) => void
  visible: boolean
}

const CarouselSlot = memo(({ item, itemWidth, slotRef, visible }: SlotProps) => {
  const contentRef = useRef<Group>(null)
  const coverRef = useRef<Mesh>(null)

  useLayoutEffect(() => {
    const content = contentRef.current
    const cover = coverRef.current
    if (!content || !cover) return
    const box = new Box3().setFromObject(content)
    if (box.isEmpty()) return
    const w = Math.max(box.max.x - box.min.x, itemWidth)
    const h = box.max.y - box.min.y
    cover.geometry.dispose()
    cover.geometry = new PlaneGeometry(w, h)
    cover.position.set(
      (box.max.x + box.min.x) / 2,
      (box.max.y + box.min.y) / 2,
      box.max.z + 0.001,
    )
  }, [itemWidth])

  // Dispose the generated geometry on unmount — useLayoutEffect's replacement
  // logic only disposes the *previous* geometry, not the final one.
  useEffect(() => () => { coverRef.current?.geometry.dispose() }, [])

  // No onClick on the cover — the carousel's document-level capture listener
  // handles click suppression. The cover stays as a drag hit-target so swiping
  // works on slot regions where user content has gaps.
  return (
    <group ref={slotRef}>
      <group ref={contentRef}>{visible ? item : null}</group>
      <mesh ref={coverRef}>
        <planeGeometry args={[itemWidth, itemWidth]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
})

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
  ...props
}: CarouselProps) => {
  const slideWidth = itemWidth + gap
  const count = items.length

  // Render twice the items and center on the first item of the second copy.
  // The first copy lives to the left, so wrap-points sit at ±N*slideWidth
  // from camera center — well off-screen — instead of ±N*slideWidth/2
  // where they'd pop in and out at the visible edges.
  const loopedItems = useMemo(() => [...items, ...items], [items])
  const slotCount = loopedItems.length
  const period = slotCount * slideWidth
  const startSlot = count + defaultValue

  const groupRef = useRef<Group>(null)
  const itemRefs = useRef<(Group | null)[]>([])

  // Slot mount/unmount state — mirrors `ref.visible` but propagates through
  // React so children that rely on lifecycle (e.g. Drei's <Html>, which
  // doesn't reliably react to mid-frame `visible` mutations) update cleanly.
  // Only flips when a slot crosses the threshold, so re-renders are limited
  // to ~2-4 per swipe instead of every frame.
  const [visibleMask, setVisibleMask] = useState<boolean[]>(() => {
    if (renderThreshold === undefined) return new Array(slotCount).fill(true)
    const mask = new Array(slotCount).fill(false)
    for (let i = 0; i < slotCount; i++) {
      mask[i] = Math.abs(i - startSlot) <= renderThreshold + 0.5
    }
    return mask
  })
  const visibleMaskRef = useRef(visibleMask)
  visibleMaskRef.current = visibleMask

  // Single source of truth: a fractional slot index that grows up/down
  // infinitely as the user navigates. group.position.x = -currIndex * slideWidth
  // at rest. Snap animations animate currIndex toward integer targets;
  // useFrame applies it to the group every frame (when not dragging).
  const currIndex = useMotionValue(startSlot)
  const isDraggingRef = useRef(false)
  const dragStartIndexRef = useRef(startSlot)
  const snapAnimRef = useRef<AnimationPlaybackControls | null>(null)
  // performance.now() of the most recent frame in which the carousel was
  // moving (drag in progress or off-snap). Click handler uses this to
  // suppress clicks during/just-after motion.
  const lastMotionAtRef = useRef(0)

  // Wrapped physical slot index (0..slotCount-1) — drives per-slot context so
  // children can read isActive/distance without the consumer having to lift
  // state. Updates the moment a snap commits, not while dragging.
  const [currentSlot, setCurrentSlot] = useState(() => mod(startSlot, slotCount))

  const initial = useMemo(
    () => ({ x: -startSlot * slideWidth }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const goTo = useCallback(
    (slot: number) => {
      onSwitch?.(mod(slot, count))
      setCurrentSlot(mod(slot, slotCount))
      snapAnimRef.current?.stop()
      snapAnimRef.current = animate(currIndex, slot, transition)
    },
    [count, slotCount, transition, onSwitch, currIndex],
  )

  useEffect(() => () => snapAnimRef.current?.stop(), [])

  // Document-level capture click listener — fires before R3F's listener (and
  // any descendant DOM handlers) anywhere in the tree. While the carousel is
  // moving (or just settled), swallow the event so it never reaches user
  // content (R3F meshes or HTML portaled by Drei). No-op outside the cooldown
  // window, so true taps propagate normally.
  useEffect(() => {
    const onClickCapture = (e: Event) => {

      if (isDragging) {
        e.stopImmediatePropagation()
        e.stopPropagation()
      }
   
    }

    document.addEventListener('click', onClickCapture, true)
    return () => document.removeEventListener('click', onClickCapture, true)
  }, [])

  // Drag start: stop any in-flight snap and capture the slot we started on
  // so an under-threshold release can elastic back to it.
  const handleDragStart = useCallback(() => {
    isDragging = false
    isDraggingRef.current = true
    lastMotionAtRef.current = performance.now()
    dragStartIndexRef.current = Math.round(currIndex.get())
    snapAnimRef.current?.stop()
    snapAnimRef.current = null
    onDragStart?.() 
  }, [currIndex, onDragStart])

  const handleDragEnd = useCallback(
    (_: PointerEvent, info: DragInfo) => {
      isDraggingRef.current = false
      const group = groupRef.current
      if (!group) return

      // Resync the motion value to where use-drag actually locked the position
      // — the next useFrame will use this same value, so there's no visible
      // jump between the dragged position and the start of the snap tween.
      const releasedX = group.position.x
      const releasedIndex = -releasedX / slideWidth
      currIndex.jump(releasedIndex)

      const startIndex = dragStartIndexRef.current
      const offsetIndex = releasedIndex - startIndex
      const overThreshold = Math.abs(offsetIndex) > dragThreshold
      const overVelocity = Math.abs(info.velocity.x) > flickVelocity

      if (!overThreshold && !overVelocity) {
        goTo(startIndex)
        return
      }

      const projectedX = releasedX + info.velocity.x * VELOCITY_PROJECTION
      const targetSlot = Math.round(-projectedX / slideWidth)
      goTo(targetSlot)
      onDragEnd?.(info)
    },
    [slideWidth, goTo, currIndex, dragThreshold, flickVelocity, onDragEnd],
  )

  // Drive position from currIndex unless the user is dragging — during drag
  // use-drag writes to group.position.x directly (and dragMomentum=false
  // ensures it stops writing the moment the pointer lifts, so there's no
  // race with the snap animation).
  useFrame(() => {
    const group = groupRef.current
    if (!group) return
    if (!isDraggingRef.current) {
      group.position.x = -currIndex.get() * slideWidth
    }
    const groupX = group.position.x
    const snapDelta = Math.abs(groupX - Math.round(groupX / slideWidth) * slideWidth)
    if (isDraggingRef.current || snapDelta > 0.001) {
      lastMotionAtRef.current = performance.now()
      isDragging = snapDelta > 0.001

    }
    let nextMask: boolean[] | null = null
    for (let i = 0; i < slotCount; i++) {
      const ref = itemRefs.current[i]
      if (!ref) continue
      const k = Math.round((-groupX - i * slideWidth) / period)
      ref.position.x = i * slideWidth + k * period
      // +0.5 margin so the leading-edge slot fades in the moment the trailing
      // one fades out — keeps the loop seamless mid-drag instead of waiting
      // for snap to settle on an integer slot.
      const slotDist = (groupX + ref.position.x) / slideWidth
      const shouldBeVisible = renderThreshold ? Math.abs(slotDist) <= renderThreshold + 0.5 : true
      ref.visible = shouldBeVisible
      if (visibleMaskRef.current[i] !== shouldBeVisible) {
        if (!nextMask) nextMask = visibleMaskRef.current.slice()
        nextMask[i] = shouldBeVisible
      }
    }
    if (nextMask) {
      visibleMaskRef.current = nextMask
      setVisibleMask(nextMask)
    }
  })

  return (
    <motion.group
      ref={groupRef}
      drag="x"
      dragMomentum={false}
      initial={initial}
      {...props}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrag={(_e: PointerEvent, info: DragInfo) => onDrag?.(info)}
    >
      {loopedItems.map((item, i) => {
        const raw = i - currentSlot
        const halfWrap = (((raw + slotCount / 2) % slotCount) + slotCount) % slotCount
        const distance = Math.abs(halfWrap - slotCount / 2)
        return (
          <CarouselSlotContext.Provider
            key={`carouselItem-${i}`}
            value={{
              slotIndex: i,
              itemIndex: i % count,
              distance,
              isActive: distance === 0,
              isNearby: distance <= 1,
              currIndex,
            }}
          >
            <CarouselSlot
              item={item}
              itemWidth={itemWidth}
              slotRef={(el) => { itemRefs.current[i] = el }}
              visible={visibleMask[i] ?? false}
            />
          </CarouselSlotContext.Provider>
        )
      })}
    </motion.group>
  )
}

export default memo(Carousel) as typeof Carousel
