import { useCallback, useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ThreeEvent, ReactThreeFiber } from "@react-three/fiber";
import type { ThreeMotionProps, DragInfo } from "../../types";
import type { Transition } from "motion/react";

type ThreeMeshProps =
  ReactThreeFiber.ThreeElements[keyof ReactThreeFiber.ThreeElements];
type ThreeInstance = Record<string, unknown>;

interface UseDragOptions {
  instanceRef: React.RefObject<ThreeInstance | null>;
  captureInstanceState: () => Record<string, unknown> | null;
  buildTargetFromState: (
    state: Record<string, unknown>,
  ) => Record<string, unknown>;
  animateToTarget: (
    values: Record<string, unknown>,
    options?: Transition,
  ) => void;
  resolveVariant: (key: string) => Record<string, unknown>;
  transition?: Transition;
  stopAnimation: () => void;
}

type ThreeMeshPropsWithDrag = ThreeMotionProps & Partial<ThreeMeshProps>;

// World-space units per CSS pixel at the given depth from the camera.
const getWorldPerPixel = (
  camera: THREE.Camera,
  depth: number,
  viewportHeight: number,
) => {
  const ortho = camera as THREE.OrthographicCamera;
  if (ortho.isOrthographicCamera) {
    return (ortho.top - ortho.bottom) / (viewportHeight * (ortho.zoom || 1));
  }
  const persp = camera as THREE.PerspectiveCamera;
  const fov = (persp.fov ?? 60) * (Math.PI / 180);
  return (2 * Math.tan(fov / 2) * depth) / viewportHeight;
};

// Velocity is averaged over a short trailing window rather than taken from the
// last pointermove pair. Consecutive moves can be 1-8ms apart, and a coalesced
// move whose position hasn't changed reports zero — noise that would otherwise
// reach consumers via DragInfo and feed momentum/flick decisions.
const VELOCITY_WINDOW_MS = 50;
const MAX_VELOCITY_SAMPLES = 24;

interface VelocitySample {
  t: number;
  x: number;
  y: number;
  z: number;
}

// Prunes `samples` to the trailing window (mutating it) and writes the average
// velocity over what remains into `out`. A pointer held still long enough for
// the window to empty reports zero, which is what a release after a pause
// should do.
const sampleVelocity = (
  samples: VelocitySample[],
  now: number,
  out: THREE.Vector3,
) => {
  while (samples.length > 1 && now - samples[0].t > VELOCITY_WINDOW_MS) {
    samples.shift();
  }
  const oldest = samples[0];
  const newest = samples[samples.length - 1];
  if (!oldest || oldest === newest) return out.set(0, 0, 0);
  const dt = (newest.t - oldest.t) / 1000;
  if (dt <= 0) return out.set(0, 0, 0);
  return out.set(
    (newest.x - oldest.x) / dt,
    (newest.y - oldest.y) / dt,
    (newest.z - oldest.z) / dt,
  );
};

const clampWithElastic = (
  value: number,
  min: number | undefined,
  max: number | undefined,
  elastic: number,
) => {
  if (min !== undefined && value < min) return min + (value - min) * elastic;
  if (max !== undefined && value > max) return max + (value - max) * elastic;
  return value;
};

export function useDrag(
  isStatic: boolean,
  props: ThreeMeshPropsWithDrag,
  options: UseDragOptions,
) {
  const { camera, gl } = useThree();
  const { drag, whileDrag, onDragStart, onPointerDown, transition } = props;
  const {
    instanceRef,
    captureInstanceState,
    buildTargetFromState,
    animateToTarget,
    resolveVariant,
    stopAnimation,
  } = options;

  const isDraggingRef = useRef(false);
  const dragStartPointerRef = useRef({ x: 0, y: 0 });
  const dragStartPosRef = useRef(new THREE.Vector3());
  const cameraRightRef = useRef(new THREE.Vector3());
  const cameraUpRef = useRef(new THREE.Vector3());
  const worldPerPixelRef = useRef(0);
  const targetPosRef = useRef(new THREE.Vector3());
  const lastPosRef = useRef(new THREE.Vector3());
  const velocityRef = useRef(new THREE.Vector3());
  const lastDeltaRef = useRef(new THREE.Vector3());
  const velocitySamplesRef = useRef<VelocitySample[]>([]);
  const preDragStateRef = useRef<Record<string, unknown> | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  // Manual spring physics for momentum / snap-to-origin. Running these in
  // useFrame rather than motion's animate() means useFrame is the *sole*
  // writer to instance.position for the entire drag lifecycle — drag,
  // momentum, snap — so there's no chance of a stale tick from a previous
  // animation landing during the handoff between phases.
  type SpringState = {
    active: boolean;
    targetX: number;
    targetY: number;
    targetZ: number;
    velX: number;
    velY: number;
    velZ: number;
    hasX: boolean;
    hasY: boolean;
    hasZ: boolean;
    stiffness: number;
    damping: number;
    onComplete?: () => void;
  };
  const springStateRef = useRef<SpringState | null>(null);
  const lastFrameTimeRef = useRef(0);

  const propsRef = useRef(props);
  propsRef.current = props;

  useFrame(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    const obj = instance as unknown as THREE.Object3D;

    // Phase 1: dragging — apply the drag target
    if (isDraggingRef.current) {
      const t = targetPosRef.current;
      obj.position.set(t.x, t.y, t.z);
      return;
    }

    // Phase 2: spring (momentum / snap-to-origin)
    const s = springStateRef.current;
    if (!s || !s.active) return;

    const now = performance.now();
    let dt = (now - lastFrameTimeRef.current) / 1000;
    if (dt > 0.05) dt = 0.05;
    if (dt <= 0) dt = 1 / 60;
    lastFrameTimeRef.current = now;

    // Sub-step the integrator for stability with stiff springs
    const subSteps = 4;
    const subDt = dt / subSteps;

    for (let i = 0; i < subSteps; i++) {
      if (s.hasX) {
        const force =
          -s.stiffness * (obj.position.x - s.targetX) - s.damping * s.velX;
        s.velX += force * subDt;
        obj.position.x += s.velX * subDt;
      }
      if (s.hasY) {
        const force =
          -s.stiffness * (obj.position.y - s.targetY) - s.damping * s.velY;
        s.velY += force * subDt;
        obj.position.y += s.velY * subDt;
      }
      if (s.hasZ) {
        const force =
          -s.stiffness * (obj.position.z - s.targetZ) - s.damping * s.velZ;
        s.velZ += force * subDt;
        obj.position.z += s.velZ * subDt;
      }
    }

    // Rest detection — stop when both speed and offset are tiny
    const speedSq = s.velX * s.velX + s.velY * s.velY + s.velZ * s.velZ;
    const offX = s.hasX ? obj.position.x - s.targetX : 0;
    const offY = s.hasY ? obj.position.y - s.targetY : 0;
    const offZ = s.hasZ ? obj.position.z - s.targetZ : 0;
    const offsetSq = offX * offX + offY * offY + offZ * offZ;
    if (speedSq < 0.0005 && offsetSq < 0.0005) {
      if (s.hasX) obj.position.x = s.targetX;
      if (s.hasY) obj.position.y = s.targetY;
      if (s.hasZ) obj.position.z = s.targetZ;
      s.active = false;
      s.onComplete?.();
    }
  });

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const instance = instanceRef.current;
      if (!instance) return;
      event.stopPropagation();

      // Halt any in-flight motion-library animation (e.g. main `animate` prop
      // tween that's still running) and any active drag spring.
      stopAnimation();
      if (springStateRef.current) springStateRef.current.active = false;

      if (whileDrag) {
        preDragStateRef.current = captureInstanceState();
        const targetValues =
          typeof whileDrag === "string"
            ? resolveVariant(whileDrag)
            : (whileDrag as Record<string, unknown>);
        animateToTarget(
          targetValues,
          (transition as Transition) || { duration: 0.1 },
        );
      }

      const obj = instance as unknown as THREE.Object3D;

      // Capture initial pointer + position. All subsequent moves are computed
      // as `initialPos + pixelDelta * worldPerPixel` — never re-derived from
      // the live (potentially-mid-animation) instance position.
      dragStartPointerRef.current.x = event.nativeEvent.clientX;
      dragStartPointerRef.current.y = event.nativeEvent.clientY;
      dragStartPosRef.current.set(
        obj.position.x,
        obj.position.y,
        obj.position.z,
      );
      targetPosRef.current.copy(dragStartPosRef.current);
      lastPosRef.current.copy(dragStartPosRef.current);
      lastDeltaRef.current.set(0, 0, 0);
      velocityRef.current.set(0, 0, 0);
      velocitySamplesRef.current = [
        {
          t: performance.now(),
          x: dragStartPosRef.current.x,
          y: dragStartPosRef.current.y,
          z: dragStartPosRef.current.z,
        },
      ];

      // Compute world-units-per-pixel at the object's perpendicular depth
      // (distance from camera along its forward axis).
      const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(
        camera.quaternion,
      );
      const cameraToObj = new THREE.Vector3().subVectors(
        dragStartPosRef.current,
        camera.position,
      );
      const depth = Math.abs(cameraToObj.dot(cameraForward));
      const rect = gl.domElement.getBoundingClientRect();
      worldPerPixelRef.current = getWorldPerPixel(camera, depth, rect.height);

      // Cache camera basis vectors so screen X/Y maps correctly to world
      // X/Y/Z even if the camera is tilted.
      cameraRightRef.current.set(1, 0, 0).applyQuaternion(camera.quaternion);
      cameraUpRef.current.set(0, 1, 0).applyQuaternion(camera.quaternion);

      isDraggingRef.current = true;
      pointerIdRef.current = event.nativeEvent.pointerId;

      try {
        gl.domElement.setPointerCapture(event.nativeEvent.pointerId);
      } catch {
        // not all environments support setPointerCapture
      }

      onDragStart?.(event.nativeEvent, {
        point: { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY },
        offset: { x: 0, y: 0, z: 0 },
        delta: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
      } satisfies DragInfo);

      onPointerDown?.(event);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      whileDrag,
      onDragStart,
      onPointerDown,
      camera,
      gl,
      captureInstanceState,
      resolveVariant,
      animateToTarget,
      stopAnimation,
      transition,
      instanceRef,
    ],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current || event.pointerId !== pointerIdRef.current)
        return;
      const instance = instanceRef.current;
      if (!instance) return;

      const cur = propsRef.current;
      const dragAxis = cur.drag;
      const elasticVal =
        typeof cur.dragElastic === "number"
          ? cur.dragElastic
          : cur.dragElastic === false
            ? 0
            : 0.5;
      const constraints = cur.dragConstraints;

      const toWorld = (clientX: number, clientY: number) => {
        const pixelDx = clientX - dragStartPointerRef.current.x;
        const pixelDy = clientY - dragStartPointerRef.current.y;
        const scale = worldPerPixelRef.current;

        let x = dragStartPosRef.current.x;
        let y = dragStartPosRef.current.y;
        let z = dragStartPosRef.current.z;

        if (dragAxis === "z") {
          // Vertical screen movement → Z. Cursor down (pixelDy > 0) = closer.
          z = dragStartPosRef.current.z + pixelDy * scale;
        } else {
          // Map screen XY to camera-relative world delta.
          const r = cameraRightRef.current;
          const u = cameraUpRef.current;
          const worldDx = r.x * pixelDx * scale + u.x * -pixelDy * scale;
          const worldDy = r.y * pixelDx * scale + u.y * -pixelDy * scale;
          const worldDz = r.z * pixelDx * scale + u.z * -pixelDy * scale;

          if (dragAxis === "x") {
            x = dragStartPosRef.current.x + worldDx;
          } else if (dragAxis === "y") {
            y = dragStartPosRef.current.y + worldDy;
          } else {
            x = dragStartPosRef.current.x + worldDx;
            y = dragStartPosRef.current.y + worldDy;
            z = dragStartPosRef.current.z + worldDz;
          }
        }

        // Constraints with elastic rubber-banding
        if (constraints) {
          if (dragAxis !== "y" && dragAxis !== "z") {
            x = clampWithElastic(
              x,
              constraints.left,
              constraints.right,
              elasticVal,
            );
          }
          if (dragAxis !== "x" && dragAxis !== "z") {
            y = clampWithElastic(
              y,
              constraints.bottom,
              constraints.top,
              elasticVal,
            );
          }
        }

        return { x, y, z };
      };

      const now = performance.now();

      // Coalesced events carry the intermediate moves the browser batched into
      // this one. Feeding them all to the velocity window makes it denser and
      // better-timed than the single delta this handler would otherwise see.
      const coalesced =
        typeof event.getCoalescedEvents === "function"
          ? event.getCoalescedEvents()
          : [];
      const points = coalesced.length ? coalesced : [event];

      const samples = velocitySamplesRef.current;
      let latest: { x: number; y: number; z: number } | null = null;
      for (const point of points) {
        const pos = toWorld(point.clientX, point.clientY);
        // event.timeStamp shares performance.now()'s time origin in practice,
        // but rebasing each coalesced stamp off `now` keeps every sample on one
        // clock even where it doesn't.
        samples.push({
          t: now - (event.timeStamp - point.timeStamp),
          x: pos.x,
          y: pos.y,
          z: pos.z,
        });
        latest = pos;
      }
      if (samples.length > MAX_VELOCITY_SAMPLES) {
        samples.splice(0, samples.length - MAX_VELOCITY_SAMPLES);
      }
      if (!latest) return;

      const { x: newX, y: newY, z: newZ } = latest;

      sampleVelocity(samples, now, velocityRef.current);
      lastDeltaRef.current.set(
        newX - lastPosRef.current.x,
        newY - lastPosRef.current.y,
        newZ - lastPosRef.current.z,
      );
      lastPosRef.current.set(newX, newY, newZ);

      // Stash target — useFrame applies it next R3F frame.
      targetPosRef.current.set(newX, newY, newZ);

      const offset = {
        x: newX - dragStartPosRef.current.x,
        y: newY - dragStartPosRef.current.y,
        z: newZ - dragStartPosRef.current.z,
      };
      cur.onDrag?.(event, {
        point: { x: event.clientX, y: event.clientY },
        offset,
        delta: {
          x: lastDeltaRef.current.x,
          y: lastDeltaRef.current.y,
          z: lastDeltaRef.current.z,
        },
        velocity: {
          x: velocityRef.current.x,
          y: velocityRef.current.y,
          z: velocityRef.current.z,
        },
      } satisfies DragInfo);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!isDraggingRef.current || event.pointerId !== pointerIdRef.current)
        return;
      isDraggingRef.current = false;
      pointerIdRef.current = null;

      const instance = instanceRef.current;
      const cur = propsRef.current;

      // Lock in the final dragged position synchronously. Once useFrame stops
      // applying the drag target, a still-pending write from the *previous*
      // momentum animation can land before the new animateToTarget() call
      // reads instance.position to use as its "from" value — which causes the
      // new animation to start from the old momentum's path instead of where
      // the user actually released.
      if (instance) {
        const obj = instance as unknown as THREE.Object3D;
        const t = targetPosRef.current;
        obj.position.set(t.x, t.y, t.z);
      }

      // Restore whileDrag visual state
      if (cur.whileDrag && preDragStateRef.current) {
        const targetValues = buildTargetFromState(preDragStateRef.current);
        animateToTarget(
          targetValues,
          (options.transition as Transition) || { duration: 0.2 },
        );
        const dur =
          ((options.transition as Record<string, unknown>)
            ?.duration as number) || 0.2;
        setTimeout(() => {
          preDragStateRef.current = null;
        }, dur * 1000);
      }

      if (!instance) return;

      const finalPos = targetPosRef.current;
      const offset = {
        x: finalPos.x - dragStartPosRef.current.x,
        y: finalPos.y - dragStartPosRef.current.y,
        z: finalPos.z - dragStartPosRef.current.z,
      };
      // Re-evaluate against the release time rather than reusing the last
      // pointermove's figure: samples outside the window get dropped, so
      // lifting after a pause releases at rest instead of inheriting whatever
      // speed the pointer last arrived with.
      sampleVelocity(
        velocitySamplesRef.current,
        performance.now(),
        velocityRef.current,
      );
      velocitySamplesRef.current = [];
      const vel = velocityRef.current;

      // Read spring tuning from dragTransition (if user provided one).
      const dt = cur.dragTransition as Record<string, unknown> | undefined;
      const userStiffness =
        typeof dt?.stiffness === "number" ? dt.stiffness : undefined;
      const userDamping =
        typeof dt?.damping === "number" ? dt.damping : undefined;

      if (cur.dragSnapToOrigin) {
        lastFrameTimeRef.current = performance.now();
        springStateRef.current = {
          active: true,
          targetX: dragStartPosRef.current.x,
          targetY: dragStartPosRef.current.y,
          targetZ: dragStartPosRef.current.z,
          velX: vel.x,
          velY: vel.y,
          velZ: vel.z,
          hasX: true,
          hasY: true,
          hasZ: true,
          stiffness: userStiffness ?? 400,
          damping: userDamping ?? 40,
        };
      } else if (cur.dragMomentum !== false) {
        const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
        if (speed > 0.5) {
          const coeff = 0.25;
          const dragAxis = cur.drag;

          const hasX = dragAxis !== "y" && dragAxis !== "z";
          const hasY = dragAxis !== "x" && dragAxis !== "z";
          const hasZ = dragAxis === "z";

          let targetX = hasX ? finalPos.x + vel.x * coeff : finalPos.x;
          let targetY = hasY ? finalPos.y + vel.y * coeff : finalPos.y;
          const targetZ = hasZ ? finalPos.z + vel.z * coeff : finalPos.z;

          const constraints = cur.dragConstraints;
          if (constraints) {
            if (hasX) {
              if (constraints.left !== undefined)
                targetX = Math.max(targetX, constraints.left);
              if (constraints.right !== undefined)
                targetX = Math.min(targetX, constraints.right);
            }
            if (hasY) {
              if (constraints.bottom !== undefined)
                targetY = Math.max(targetY, constraints.bottom);
              if (constraints.top !== undefined)
                targetY = Math.min(targetY, constraints.top);
            }
          }

          lastFrameTimeRef.current = performance.now();
          springStateRef.current = {
            active: true,
            targetX,
            targetY,
            targetZ,
            velX: hasX ? vel.x : 0,
            velY: hasY ? vel.y : 0,
            velZ: hasZ ? vel.z : 0,
            hasX,
            hasY,
            hasZ,
            stiffness: userStiffness ?? 200,
            damping: userDamping ?? 50,
          };
        }
      }

      cur.onDragEnd?.(event, {
        point: { x: event.clientX, y: event.clientY },
        offset,
        delta: {
          x: lastDeltaRef.current.x,
          y: lastDeltaRef.current.y,
          z: lastDeltaRef.current.z,
        },
        velocity: { x: vel.x, y: vel.y, z: vel.z },
      } satisfies DragInfo);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, instanceRef, animateToTarget, buildTargetFromState]);

  const isDragEnabled = drag !== undefined && drag !== false;
  if (isStatic || !isDragEnabled) return {};

  return { onPointerDown: handlePointerDown };
}
