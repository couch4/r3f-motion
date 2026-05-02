import { useCallback, useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
// World-space units per CSS pixel at the given depth from the camera.
const getWorldPerPixel = (camera, depth, viewportHeight) => {
    var _a;
    const ortho = camera;
    if (ortho.isOrthographicCamera) {
        return ((ortho.top - ortho.bottom) / (viewportHeight * (ortho.zoom || 1)));
    }
    const persp = camera;
    const fov = ((_a = persp.fov) !== null && _a !== void 0 ? _a : 60) * (Math.PI / 180);
    return (2 * Math.tan(fov / 2) * depth) / viewportHeight;
};
const clampWithElastic = (value, min, max, elastic) => {
    if (min !== undefined && value < min)
        return min + (value - min) * elastic;
    if (max !== undefined && value > max)
        return max + (value - max) * elastic;
    return value;
};
export function useDrag(isStatic, props, options) {
    const { camera, gl } = useThree();
    const { drag, whileDrag, onDragStart, onPointerDown, transition } = props;
    const { instanceRef, captureInstanceState, buildTargetFromState, animateToTarget, resolveVariant, stopAnimation, } = options;
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
    const lastTimeRef = useRef(0);
    const preDragStateRef = useRef(null);
    const pointerIdRef = useRef(null);
    const springStateRef = useRef(null);
    const lastFrameTimeRef = useRef(0);
    const propsRef = useRef(props);
    propsRef.current = props;
    useFrame(() => {
        var _a;
        const instance = instanceRef.current;
        if (!instance)
            return;
        const obj = instance;
        // Phase 1: dragging — apply the drag target
        if (isDraggingRef.current) {
            const t = targetPosRef.current;
            obj.position.set(t.x, t.y, t.z);
            return;
        }
        // Phase 2: spring (momentum / snap-to-origin)
        const s = springStateRef.current;
        if (!s || !s.active)
            return;
        const now = performance.now();
        let dt = (now - lastFrameTimeRef.current) / 1000;
        if (dt > 0.05)
            dt = 0.05;
        if (dt <= 0)
            dt = 1 / 60;
        lastFrameTimeRef.current = now;
        // Sub-step the integrator for stability with stiff springs
        const subSteps = 4;
        const subDt = dt / subSteps;
        for (let i = 0; i < subSteps; i++) {
            if (s.hasX) {
                const force = -s.stiffness * (obj.position.x - s.targetX) - s.damping * s.velX;
                s.velX += force * subDt;
                obj.position.x += s.velX * subDt;
            }
            if (s.hasY) {
                const force = -s.stiffness * (obj.position.y - s.targetY) - s.damping * s.velY;
                s.velY += force * subDt;
                obj.position.y += s.velY * subDt;
            }
            if (s.hasZ) {
                const force = -s.stiffness * (obj.position.z - s.targetZ) - s.damping * s.velZ;
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
            if (s.hasX)
                obj.position.x = s.targetX;
            if (s.hasY)
                obj.position.y = s.targetY;
            if (s.hasZ)
                obj.position.z = s.targetZ;
            s.active = false;
            (_a = s.onComplete) === null || _a === void 0 ? void 0 : _a.call(s);
        }
    });
    const handlePointerDown = useCallback((event) => {
        const instance = instanceRef.current;
        if (!instance)
            return;
        event.stopPropagation();
        // Halt any in-flight motion-library animation (e.g. main `animate` prop
        // tween that's still running) and any active drag spring.
        stopAnimation();
        if (springStateRef.current)
            springStateRef.current.active = false;
        if (whileDrag) {
            preDragStateRef.current = captureInstanceState();
            const targetValues = typeof whileDrag === "string"
                ? resolveVariant(whileDrag)
                : whileDrag;
            animateToTarget(targetValues, transition || { duration: 0.1 });
        }
        const obj = instance;
        // Capture initial pointer + position. All subsequent moves are computed
        // as `initialPos + pixelDelta * worldPerPixel` — never re-derived from
        // the live (potentially-mid-animation) instance position.
        dragStartPointerRef.current.x = event.nativeEvent.clientX;
        dragStartPointerRef.current.y = event.nativeEvent.clientY;
        dragStartPosRef.current.set(obj.position.x, obj.position.y, obj.position.z);
        targetPosRef.current.copy(dragStartPosRef.current);
        lastPosRef.current.copy(dragStartPosRef.current);
        lastDeltaRef.current.set(0, 0, 0);
        velocityRef.current.set(0, 0, 0);
        lastTimeRef.current = performance.now();
        // Compute world-units-per-pixel at the object's perpendicular depth
        // (distance from camera along its forward axis).
        const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const cameraToObj = new THREE.Vector3().subVectors(dragStartPosRef.current, camera.position);
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
        }
        catch (_a) {
            // not all environments support setPointerCapture
        }
        onDragStart === null || onDragStart === void 0 ? void 0 : onDragStart(event.nativeEvent, {
            point: { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY },
            offset: { x: 0, y: 0, z: 0 },
            delta: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
        });
        onPointerDown === null || onPointerDown === void 0 ? void 0 : onPointerDown(event);
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
    ]);
    useEffect(() => {
        const handlePointerMove = (event) => {
            var _a;
            if (!isDraggingRef.current || event.pointerId !== pointerIdRef.current)
                return;
            const instance = instanceRef.current;
            if (!instance)
                return;
            const cur = propsRef.current;
            const dragAxis = cur.drag;
            const elasticVal = typeof cur.dragElastic === "number"
                ? cur.dragElastic
                : cur.dragElastic === false
                    ? 0
                    : 0.5;
            const constraints = cur.dragConstraints;
            const pixelDx = event.clientX - dragStartPointerRef.current.x;
            const pixelDy = event.clientY - dragStartPointerRef.current.y;
            const scale = worldPerPixelRef.current;
            let newX = dragStartPosRef.current.x;
            let newY = dragStartPosRef.current.y;
            let newZ = dragStartPosRef.current.z;
            if (dragAxis === "z") {
                // Vertical screen movement → Z. Cursor down (pixelDy > 0) = closer.
                newZ = dragStartPosRef.current.z + pixelDy * scale;
            }
            else {
                // Map screen XY to camera-relative world delta.
                const r = cameraRightRef.current;
                const u = cameraUpRef.current;
                const worldDx = r.x * pixelDx * scale + u.x * -pixelDy * scale;
                const worldDy = r.y * pixelDx * scale + u.y * -pixelDy * scale;
                const worldDz = r.z * pixelDx * scale + u.z * -pixelDy * scale;
                if (dragAxis === "x") {
                    newX = dragStartPosRef.current.x + worldDx;
                }
                else if (dragAxis === "y") {
                    newY = dragStartPosRef.current.y + worldDy;
                }
                else {
                    newX = dragStartPosRef.current.x + worldDx;
                    newY = dragStartPosRef.current.y + worldDy;
                    newZ = dragStartPosRef.current.z + worldDz;
                }
            }
            // Constraints with elastic rubber-banding
            if (constraints) {
                if (dragAxis !== "y" && dragAxis !== "z") {
                    newX = clampWithElastic(newX, constraints.left, constraints.right, elasticVal);
                }
                if (dragAxis !== "x" && dragAxis !== "z") {
                    newY = clampWithElastic(newY, constraints.bottom, constraints.top, elasticVal);
                }
            }
            // Velocity tracking (used for momentum on release)
            const now = performance.now();
            const dt = (now - lastTimeRef.current) / 1000;
            if (dt > 0) {
                const dx = newX - lastPosRef.current.x;
                const dy = newY - lastPosRef.current.y;
                const dz = newZ - lastPosRef.current.z;
                velocityRef.current.set(dx / dt, dy / dt, dz / dt);
                lastDeltaRef.current.set(dx, dy, dz);
            }
            lastTimeRef.current = now;
            lastPosRef.current.set(newX, newY, newZ);
            // Stash target — useFrame applies it next R3F frame.
            targetPosRef.current.set(newX, newY, newZ);
            const offset = {
                x: newX - dragStartPosRef.current.x,
                y: newY - dragStartPosRef.current.y,
                z: newZ - dragStartPosRef.current.z,
            };
            (_a = cur.onDrag) === null || _a === void 0 ? void 0 : _a.call(cur, event, {
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
            });
        };
        const handlePointerUp = (event) => {
            var _a, _b;
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
                const obj = instance;
                const t = targetPosRef.current;
                obj.position.set(t.x, t.y, t.z);
            }
            // Restore whileDrag visual state
            if (cur.whileDrag && preDragStateRef.current) {
                const targetValues = buildTargetFromState(preDragStateRef.current);
                animateToTarget(targetValues, options.transition || { duration: 0.2 });
                const dur = ((_a = options.transition) === null || _a === void 0 ? void 0 : _a.duration) || 0.2;
                setTimeout(() => {
                    preDragStateRef.current = null;
                }, dur * 1000);
            }
            if (!instance)
                return;
            const finalPos = targetPosRef.current;
            const offset = {
                x: finalPos.x - dragStartPosRef.current.x,
                y: finalPos.y - dragStartPosRef.current.y,
                z: finalPos.z - dragStartPosRef.current.z,
            };
            const vel = velocityRef.current;
            // Read spring tuning from dragTransition (if user provided one).
            const dt = cur.dragTransition;
            const userStiffness = typeof (dt === null || dt === void 0 ? void 0 : dt.stiffness) === "number" ? dt.stiffness : undefined;
            const userDamping = typeof (dt === null || dt === void 0 ? void 0 : dt.damping) === "number" ? dt.damping : undefined;
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
                    stiffness: userStiffness !== null && userStiffness !== void 0 ? userStiffness : 400,
                    damping: userDamping !== null && userDamping !== void 0 ? userDamping : 40,
                };
            }
            else if (cur.dragMomentum !== false) {
                const speed = Math.sqrt(Math.pow(vel.x, 2) + Math.pow(vel.y, 2) + Math.pow(vel.z, 2));
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
                        stiffness: userStiffness !== null && userStiffness !== void 0 ? userStiffness : 200,
                        damping: userDamping !== null && userDamping !== void 0 ? userDamping : 50,
                    };
                }
            }
            (_b = cur.onDragEnd) === null || _b === void 0 ? void 0 : _b.call(cur, event, {
                point: { x: event.clientX, y: event.clientY },
                offset,
                delta: {
                    x: lastDeltaRef.current.x,
                    y: lastDeltaRef.current.y,
                    z: lastDeltaRef.current.z,
                },
                velocity: { x: vel.x, y: vel.y, z: vel.z },
            });
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
    if (isStatic || !isDragEnabled)
        return {};
    return { onPointerDown: handlePointerDown };
}
//# sourceMappingURL=use-drag.js.map