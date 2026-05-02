import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
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

interface SlotProps {
  item: ReactNode
  itemWidth: number
  slotRef: (el: Group | null) => void
  hadDragRef: RefObject<boolean>
}

const CarouselSlot = memo(({ hadDragRef, item, itemWidth, slotRef }: SlotProps) => {
  const contentRef = useRef<Group>(null)
  const coverRef = useRef<Mesh>(null)

  useLayoutEffect(() => {
    const content = contentRef.current
    const cover = coverRef.current
    if (!content || !cover) return
    const box = new Box3().setFromObject(content)
    if (box.isEmpty()) return
    const h = box.max.y - box.min.y
    cover.geometry.dispose()
    cover.geometry = new PlaneGeometry(itemWidth, h)
    cover.position.z = box.max.z + 0.001
  }, [item, itemWidth])

  // Dispose the generated geometry on unmount — useLayoutEffect's replacement
  // logic only disposes the *previous* geometry, not the final one.
  useEffect(() => () => { coverRef.current?.geometry.dispose() }, [])

  return (
    <group ref={slotRef}>
      <group ref={contentRef}>{item}</group>
      <mesh
        ref={coverRef}
        onClick={(e) => {
          if (hadDragRef.current) {
            e.stopPropagation()
            hadDragRef.current = false
          }
        }}
      >
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
  renderThreshold = 1,
  dragThreshold = DRAG_THRESHOLD_RATIO,
  flickVelocity = FLICK_VELOCITY,
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

  // Single source of truth: a fractional slot index that grows up/down
  // infinitely as the user navigates. group.position.x = -currIndex * slideWidth
  // at rest. Snap animations animate currIndex toward integer targets;
  // useFrame applies it to the group every frame (when not dragging).
  const currIndex = useMotionValue(startSlot)
  const isDraggingRef = useRef(false)
  const hadDragRef = useRef(false)
  const dragStartIndexRef = useRef(startSlot)
  const snapAnimRef = useRef<AnimationPlaybackControls | null>(null)

  const initial = useMemo(
    () => ({ x: -startSlot * slideWidth }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const goTo = useCallback(
    (slot: number) => {
      onSwitch?.(mod(slot, count))
      snapAnimRef.current?.stop()
      snapAnimRef.current = animate(currIndex, slot, transition)
    },
    [count, transition, onSwitch, currIndex],
  )

  useEffect(() => () => snapAnimRef.current?.stop(), [])

  // Drag start: stop any in-flight snap and capture the slot we started on
  // so an under-threshold release can elastic back to it.
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true
    hadDragRef.current = false
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

      hadDragRef.current = true
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
    for (let i = 0; i < slotCount; i++) {
      const ref = itemRefs.current[i]
      if (!ref) continue
      const k = Math.round((-groupX - i * slideWidth) / period)
      ref.position.x = i * slideWidth + k * period
      // +0.5 margin so the leading-edge slot fades in the moment the trailing
      // one fades out — keeps the loop seamless mid-drag instead of waiting
      // for snap to settle on an integer slot.
      const slotDist = (groupX + ref.position.x) / slideWidth
      ref.visible = Math.abs(slotDist) <= renderThreshold + 0.5
    }
  })

  return (
    <motion.group
      ref={groupRef}
      drag="x"
      dragMomentum={false}
      initial={initial}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrag={(_e: PointerEvent, info: DragInfo) => onDrag?.(info)}
    >
      {loopedItems.map((item, i) => (
        <CarouselSlot
          key={`carouselItem-${i}`}
          item={item}
          itemWidth={itemWidth}
          slotRef={(el) => { itemRefs.current[i] = el }}
          hadDragRef={hadDragRef}
        />
      ))}
    </motion.group>
  )
}

export default memo(Carousel) as typeof Carousel
