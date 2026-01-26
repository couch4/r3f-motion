import { __rest } from "tslib";
import { useRef, forwardRef, useEffect, useCallback, createContext, useContext, createElement, useMemo, } from "react";
import { animate as animateFn } from "motion";
import { useRender } from "./use-render";
import { useHover } from "./gestures/use-hover";
import { useTap } from "./gestures/use-tap";
const MotionContext = createContext(null);
function custom(Component) {
    const MotionComponent = forwardRef((props, ref) => {
        const instanceRef = useRef(null);
        const animationRef = useRef(null);
        const childIndexCounterRef = useRef(0);
        const parentContext = useContext(MotionContext);
        const childIndex = useMemo(() => { var _a, _b; return (_b = (_a = parentContext === null || parentContext === void 0 ? void 0 : parentContext.getNextChildIndex) === null || _a === void 0 ? void 0 : _a.call(parentContext)) !== null && _b !== void 0 ? _b : 0; }, 
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []);
        const _a = props, { initial: initialProp, animate: animateProp, transition, variants, custom, inherit = true, children } = _a, restProps = __rest(_a, ["initial", "animate", "transition", "variants", "custom", "inherit", "children"]);
        const initial = initialProp !== undefined
            ? initialProp
            : inherit && (parentContext === null || parentContext === void 0 ? void 0 : parentContext.initial);
        const animate = animateProp !== undefined
            ? animateProp
            : inherit && (parentContext === null || parentContext === void 0 ? void 0 : parentContext.animate);
        const effectiveVariants = variants || (inherit ? parentContext === null || parentContext === void 0 ? void 0 : parentContext.variants : undefined);
        const effectiveCustom = custom !== undefined ? custom : parentContext === null || parentContext === void 0 ? void 0 : parentContext.custom;
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
        const animateToTarget = useCallback((targetValues, options) => {
            var _a;
            const instance = instanceRef.current;
            if (!instance || !targetValues)
                return;
            (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.stop();
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
            const animateColor = (target, value, opts) => {
                const ColorConstructor = target.constructor;
                const tempColor = new ColorConstructor(value);
                ["r", "g", "b"].forEach((channel) => animations.push(animateFn(target, { [channel]: tempColor[channel] }, opts)));
            };
            Object.entries(targetValues).forEach(([key, value]) => {
                const opts = getPropertyOpts(key);
                const mapping = transformMap[key];
                if (mapping === null || mapping === void 0 ? void 0 : mapping.target) {
                    if (mapping.multi) {
                        ["x", "y", "z"].forEach((axis) => animations.push(animateFn(mapping.target, { [axis]: value }, opts)));
                    }
                    else {
                        animations.push(animateFn(mapping.target, { [mapping.prop]: value }, opts));
                    }
                }
                else if (key === "color" && instance.color) {
                    animateColor(instance.color, value, opts);
                }
                else if (key === "emissive" && instance.emissive) {
                    animateColor(instance.emissive, value, opts);
                }
                else if (key === "opacity" && instance.opacity !== undefined) {
                    animations.push(animateFn(instance, { opacity: value }, opts));
                }
                else if (key === "emissiveIntensity" &&
                    instance.emissiveIntensity !== undefined) {
                    animations.push(animateFn(instance, { emissiveIntensity: value }, opts));
                }
                else if (key === "roughness" &&
                    instance.roughness !== undefined) {
                    animations.push(animateFn(instance, { roughness: value }, opts));
                }
                else if (key === "metalness" &&
                    instance.metalness !== undefined) {
                    animations.push(animateFn(instance, { metalness: value }, opts));
                }
            });
            animationRef.current = {
                stop: () => animations.forEach((anim) => { var _a; return (_a = anim.stop) === null || _a === void 0 ? void 0 : _a.call(anim); }),
            };
        }, []);
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
            animateToTarget(targetValues, effectiveTransition);
            return () => { var _a; return (_a = animationRef.current) === null || _a === void 0 ? void 0 : _a.stop(); };
        }, [
            animate,
            transition,
            resolveVariant,
            animateToTarget,
            childIndex,
            parentContext,
        ]);
        const gestureProps = {
            instanceRef,
            captureInstanceState,
            buildTargetFromState,
            animateToTarget,
            resolveVariant,
            transition,
        };
        const gestureHandlers = Object.assign(Object.assign({}, useHover(false, props, gestureProps)), useTap(false, props, gestureProps));
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
    return MotionComponent;
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