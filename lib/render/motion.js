import { __rest } from "tslib";
import { useRef, memo, forwardRef, useEffect, useCallback, createContext, useContext, createElement, useMemo, } from "react";
import { animate as animateFn } from "motion";
import { PresenceContext } from "../components/AnimatePresence/PresenceContext";
import { useRender } from "./use-render";
import { useHover } from "./gestures/use-hover";
import { useTap } from "./gestures/use-tap";
import { useDrag } from "./gestures/use-drag";
import { createAnimationState, createCallbackOptions, registerAnimation, } from "./events";
const MotionContext = createContext(null);
function custom(Component) {
    const MotionComponent = forwardRef((props, ref) => {
        const instanceRef = useRef(null);
        const animationRef = useRef(null);
        const childIndexCounterRef = useRef(0);
        const animStateRef = useRef(createAnimationState());
        const callbacksRef = useRef(undefined);
        const parentContext = useContext(MotionContext);
        const childIndex = useMemo(() => { var _a, _b; return (_b = (_a = parentContext === null || parentContext === void 0 ? void 0 : parentContext.getNextChildIndex) === null || _a === void 0 ? void 0 : _a.call(parentContext)) !== null && _b !== void 0 ? _b : 0; }, 
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []);
        const presenceContext = useContext(PresenceContext);
        const _a = props, { initial: initialProp, animate: animateProp, exit: exitProp, transition, variants, custom, inherit = true, children, onAnimationUpdate, onAnimationStart, onAnimationComplete } = _a, restProps = __rest(_a, ["initial", "animate", "exit", "transition", "variants", "custom", "inherit", "children", "onAnimationUpdate", "onAnimationStart", "onAnimationComplete"]);
        const initial = initialProp !== undefined
            ? initialProp
            : inherit && (parentContext === null || parentContext === void 0 ? void 0 : parentContext.initial);
        const animate = animateProp !== undefined
            ? animateProp
            : inherit && (parentContext === null || parentContext === void 0 ? void 0 : parentContext.animate);
        const effectiveVariants = variants || (inherit ? parentContext === null || parentContext === void 0 ? void 0 : parentContext.variants : undefined);
        const effectiveCustom = custom !== undefined ? custom : parentContext === null || parentContext === void 0 ? void 0 : parentContext.custom;
        // Update callbacks ref on every render
        if (onAnimationUpdate || onAnimationStart || onAnimationComplete) {
            const typedCallbacks = {};
            if (onAnimationUpdate) {
                typedCallbacks.onAnimationUpdate = onAnimationUpdate;
            }
            if (onAnimationStart) {
                typedCallbacks.onAnimationStart = onAnimationStart;
            }
            if (onAnimationComplete) {
                typedCallbacks.onAnimationComplete = onAnimationComplete;
            }
            callbacksRef.current = typedCallbacks;
        }
        else {
            callbacksRef.current = undefined;
        }
        const resolveVariant = useCallback((variantKey) => {
            if (!effectiveVariants || !variantKey)
                return null;
            const variant = effectiveVariants[variantKey];
            return typeof variant === "function"
                ? variant(effectiveCustom)
                : variant;
        }, [effectiveVariants, effectiveCustom]);
        const captureInstanceState = useCallback(() => {
            const instance = instanceRef.current;
            if (!instance)
                return null;
            return {
                position: {
                    x: instance.position.x,
                    y: instance.position.y,
                    z: instance.position.z,
                },
                rotation: {
                    x: instance.rotation.x,
                    y: instance.rotation.y,
                    z: instance.rotation.z,
                },
                scale: {
                    x: instance.scale.x,
                    y: instance.scale.y,
                    z: instance.scale.z,
                },
            };
        }, []);
        const buildTargetFromState = useCallback((capturedState) => ({
            x: capturedState.position.x,
            y: capturedState.position.y,
            z: capturedState.position.z,
            rotateX: capturedState.rotation.x,
            rotateY: capturedState.rotation.y,
            rotateZ: capturedState.rotation.z,
            scale: capturedState.scale.x,
        }), []);
        const animateToTarget = useCallback((targetValues, options, useCallbacks = false) => {
            var _a;
            const instance = instanceRef.current;
            if (!instance || !targetValues)
                return;
            (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.stop();
            // Reset animation state when using callbacks
            if (useCallbacks) {
                animStateRef.current = createAnimationState();
            }
            const animState = animStateRef.current;
            const callbacks = useCallbacks ? callbacksRef.current : undefined;
            const animateVariant = animate;
            const convertOptions = (opts) => {
                if (!opts)
                    return { type: "tween" };
                const base = {
                    type: opts.type === "spring"
                        ? "spring"
                        : opts.type === "inertia"
                            ? "inertia"
                            : "tween",
                };
                const validKeys = [
                    "duration",
                    "ease",
                    "delay",
                    "repeat",
                    "repeatType",
                    "repeatDelay",
                    "stiffness",
                    "damping",
                    "mass",
                    "restDelta",
                    "restSpeed",
                ];
                return Object.assign(base, ...validKeys
                    .filter((key) => opts[key] !== undefined)
                    .map((key) => ({ [key]: opts[key] })));
            };
            const getPropertyOpts = (key) => options && typeof options === "object" && key in options
                ? convertOptions(options[key])
                : convertOptions(options);
            const transformMap = {
                x: { target: instance.position, prop: "x" },
                y: { target: instance.position, prop: "y" },
                z: { target: instance.position, prop: "z" },
                rotateX: { target: instance.rotation, prop: "x" },
                rotateY: { target: instance.rotation, prop: "y" },
                rotateZ: { target: instance.rotation, prop: "z" },
                scale: { target: instance.scale, prop: "x", multi: true },
                scaleX: { target: instance.scale, prop: "x" },
                scaleY: { target: instance.scale, prop: "y" },
                scaleZ: { target: instance.scale, prop: "z" },
            };
            const animations = [];
            // Helper to create animation with optional callbacks
            const createAnimation = (target, props, opts, propertyKey) => {
                const animOpts = callbacks
                    ? createCallbackOptions(opts, callbacks, animState, animateVariant, propertyKey)
                    : opts;
                animations.push(animateFn(target, props, animOpts));
                if (callbacks) {
                    registerAnimation(animState);
                }
            };
            const animateColor = (target, value, opts, key) => {
                const ColorConstructor = target.constructor;
                const tempColor = new ColorConstructor(value);
                ["r", "g", "b"].forEach((channel) => createAnimation(target, { [channel]: tempColor[channel] }, opts, key));
            };
            // Color-type properties that need RGB channel animation
            const colorKeys = new Set([
                "color",
                "emissive",
                "specular",
                "sheenColor",
                "attenuationColor",
            ]);
            Object.entries(targetValues).forEach(([key, value]) => {
                var _a;
                const opts = getPropertyOpts(key);
                const mapping = transformMap[key];
                if (mapping === null || mapping === void 0 ? void 0 : mapping.target) {
                    if (mapping.multi) {
                        ["x", "y", "z"].forEach((axis) => createAnimation(mapping.target, { [axis]: value }, opts, key));
                    }
                    else {
                        createAnimation(mapping.target, { [mapping.prop]: value }, opts, key);
                    }
                }
                else if (colorKeys.has(key) && instance[key]) {
                    animateColor(instance[key], value, opts, key);
                }
                else if (instance.uniforms &&
                    instance.uniforms[key] &&
                    typeof ((_a = instance.uniforms[key]) === null || _a === void 0 ? void 0 : _a.value) === "number") {
                    // Animate ShaderMaterial uniforms (uniforms[key].value)
                    // Note: consumers must useMemo their uniforms prop to prevent
                    // R3F from overwriting animated values on re-render
                    createAnimation(instance.uniforms[key], { value: value }, opts, key);
                }
                else if (key in instance && typeof instance[key] === "number") {
                    createAnimation(instance, { [key]: value }, opts, key);
                }
            });
            animationRef.current = {
                stop: () => animations.forEach((anim) => { var _a; return (_a = anim.stop) === null || _a === void 0 ? void 0 : _a.call(anim); }),
            };
        }, [animate]);
        useEffect(() => {
            if (!instanceRef.current || !animate)
                return;
            const resolved = typeof animate === "string" ? resolveVariant(animate) : animate;
            if (!resolved)
                return;
            const resolvedObj = resolved;
            const { transition: variantTransition } = resolvedObj, targetValues = __rest(resolvedObj, ["transition"]);
            let effectiveTransition = variantTransition || transition;
            const parentTrans = parentContext === null || parentContext === void 0 ? void 0 : parentContext.transition;
            if ((parentTrans === null || parentTrans === void 0 ? void 0 : parentTrans.delayChildren) !== undefined ||
                (parentTrans === null || parentTrans === void 0 ? void 0 : parentTrans.staggerChildren) !== undefined) {
                const orchestrationDelay = (parentTrans.delayChildren || 0) +
                    childIndex * (parentTrans.staggerChildren || 0);
                effectiveTransition = Object.assign(Object.assign({}, effectiveTransition), { delay: ((effectiveTransition === null || effectiveTransition === void 0 ? void 0 : effectiveTransition.delay) || 0) + orchestrationDelay });
            }
            animateToTarget(targetValues, effectiveTransition, true);
            return () => { var _a; return (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.stop(); };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [animate]);
        // Handle exit animation when presence context signals removal
        useEffect(() => {
            var _a;
            if (!presenceContext || presenceContext.isPresent)
                return;
            if (!instanceRef.current || !exitProp) {
                // No exit animation defined, safe to remove immediately
                presenceContext.safeToRemove();
                return;
            }
            const resolved = typeof exitProp === "string" ? resolveVariant(exitProp) : exitProp;
            if (!resolved) {
                presenceContext.safeToRemove();
                return;
            }
            const resolvedObj = resolved;
            const { transition: exitTransition } = resolvedObj, exitValues = __rest(resolvedObj, ["transition"]);
            const effectiveExitTransition = exitTransition || transition;
            // Store safeToRemove in a ref-like closure so onAnimationComplete can call it
            const originalComplete = (_a = callbacksRef.current) === null || _a === void 0 ? void 0 : _a.onAnimationComplete;
            const safeToRemove = presenceContext.safeToRemove;
            callbacksRef.current = Object.assign(Object.assign({}, callbacksRef.current), { onAnimationComplete: (variant) => {
                    originalComplete === null || originalComplete === void 0 ? void 0 : originalComplete(variant);
                    safeToRemove();
                } });
            animateToTarget(exitValues, effectiveExitTransition, true);
            return () => { var _a; return (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.stop(); };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [presenceContext === null || presenceContext === void 0 ? void 0 : presenceContext.isPresent]);
        const stopAnimation = useCallback(() => {
            var _a;
            (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.stop();
        }, []);
        const gestureProps = {
            instanceRef,
            captureInstanceState,
            buildTargetFromState,
            animateToTarget,
            resolveVariant,
            transition,
            stopAnimation,
        };
        const gestureHandlers = Object.assign(Object.assign(Object.assign({}, useHover(false, props, gestureProps)), useTap(false, props, gestureProps)), useDrag(false, props, gestureProps));
        const resolvedInitialValues = typeof initial === "string" ? resolveVariant(initial) : initial;
        const element = useRender(Component, Object.assign(Object.assign(Object.assign({}, restProps), gestureHandlers), { children }), ref, instanceRef, resolvedInitialValues);
        const getNextChildIndex = useCallback(() => {
            const index = childIndexCounterRef.current;
            childIndexCounterRef.current += 1;
            return index;
        }, []);
        if (initial !== undefined || animate !== undefined || effectiveVariants) {
            const contextValue = {
                initial,
                animate,
                variants: effectiveVariants,
                transition,
                custom: effectiveCustom,
                getNextChildIndex,
            };
            return createElement(MotionContext.Provider, { value: contextValue }, element);
        }
        return element;
    });
    MotionComponent.displayName = `Motion(${Component})`;
    return memo(MotionComponent);
}
const componentCache = new Map();
export const motion = new Proxy(custom, {
    get: (_, key) => {
        if (!componentCache.has(key)) {
            componentCache.set(key, custom(key));
        }
        return componentCache.get(key);
    },
});
//# sourceMappingURL=motion.js.map