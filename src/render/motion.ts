import { MotionProps } from "motion/react";
import {
  useRef,
  memo,
  forwardRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
  createElement,
  useMemo,
} from "react";
import { animate as animateFn } from "motion";
import type { ThreeMotionComponents, ThreeElement } from "../types";
import { useRender } from "./use-render";
import { useHover } from "./gestures/use-hover";
import { useTap } from "./gestures/use-tap";
import {
  createAnimationState,
  createCallbackOptions,
  registerAnimation,
  type AnimationCallbacks,
} from "./events";

interface MotionContextValue {
  initial?: unknown;
  animate?: unknown;
  variants?: unknown;
  transition?: unknown;
  custom?: unknown;
  childIndex?: number;
  getNextChildIndex?: () => number;
}

interface CapturedState {
  [key: string]: unknown;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

interface AnimationControl {
  stop: () => void;
}

type R3FMotionProps = MotionProps & {
  onAnimationUpdate?: (
    values: Record<string, unknown>,
    variant?: string,
  ) => void;
};

const MotionContext = createContext<MotionContextValue | null>(null);

function custom<Props>(Component: string) {
  const MotionComponent = forwardRef<ThreeElement, Props & MotionProps>(
    (props, ref) => {
      const instanceRef = useRef<ThreeElement | null>(null);
      const animationRef = useRef<AnimationControl | null>(null);
      const childIndexCounterRef = useRef<number>(0);
      const animStateRef = useRef(createAnimationState());
      const callbacksRef = useRef<AnimationCallbacks | undefined>(undefined);

      const parentContext = useContext(MotionContext);
      const childIndex = useMemo(
        () => parentContext?.getNextChildIndex?.() ?? 0,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
      );

      const {
        initial: initialProp,
        animate: animateProp,
        transition,
        variants,
        custom,
        inherit = true,
        children,
        onAnimationUpdate,
        onAnimationStart,
        onAnimationComplete,
        ...restProps
      } = props as Props & R3FMotionProps;

      const initial =
        initialProp !== undefined
          ? initialProp
          : inherit && parentContext?.initial;
      const animate =
        animateProp !== undefined
          ? animateProp
          : inherit && parentContext?.animate;
      const effectiveVariants =
        variants || (inherit ? parentContext?.variants : undefined);
      const effectiveCustom =
        custom !== undefined ? custom : parentContext?.custom;

      // Update callbacks ref on every render
      if (onAnimationUpdate || onAnimationStart || onAnimationComplete) {
        const typedCallbacks: AnimationCallbacks = {};
        if (onAnimationUpdate) {
          typedCallbacks.onAnimationUpdate = onAnimationUpdate as (
            value?: unknown,
            variant?: string,
          ) => void;
        }
        if (onAnimationStart) {
          typedCallbacks.onAnimationStart = onAnimationStart as (
            variant?: string,
          ) => void;
        }
        if (onAnimationComplete) {
          typedCallbacks.onAnimationComplete = onAnimationComplete as (
            variant?: string,
          ) => void;
        }
        callbacksRef.current = typedCallbacks;
      } else {
        callbacksRef.current = undefined;
      }

      const resolveVariant = useCallback(
        (variantKey: string) => {
          if (!effectiveVariants || !variantKey) return null;
          const variant = (effectiveVariants as Record<string, unknown>)[
            variantKey
          ];
          return typeof variant === "function"
            ? variant(effectiveCustom)
            : variant;
        },
        [effectiveVariants, effectiveCustom],
      );

      const captureInstanceState = useCallback((): CapturedState | null => {
        const instance = instanceRef.current;
        if (!instance) return null;
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

      const buildTargetFromState = useCallback(
        (capturedState: CapturedState): Record<string, number> => ({
          x: capturedState.position.x,
          y: capturedState.position.y,
          z: capturedState.position.z,
          rotateX: capturedState.rotation.x,
          rotateY: capturedState.rotation.y,
          rotateZ: capturedState.rotation.z,
          scale: capturedState.scale.x,
        }),
        [],
      );

      const animateToTarget = useCallback(
        (
          targetValues: Record<string, unknown>,
          options?: Record<string, unknown>,
          useCallbacks = false,
        ) => {
          const instance = instanceRef.current;
          if (!instance || !targetValues) return;

          animationRef.current?.stop();

          // Reset animation state when using callbacks
          if (useCallbacks) {
            animStateRef.current = createAnimationState();
          }

          const animState = animStateRef.current;
          const callbacks = useCallbacks ? callbacksRef.current : undefined;
          const animateVariant = animate as
            | string
            | Record<string, unknown>
            | undefined;

          const convertOptions = (
            opts?: Record<string, unknown>,
          ): Record<string, unknown> => {
            if (!opts) return { type: "tween" };
            const base = {
              type:
                opts.type === "spring"
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
            return Object.assign(
              base,
              ...validKeys
                .filter((key) => opts[key] !== undefined)
                .map((key) => ({ [key]: opts[key] })),
            );
          };

          const getPropertyOpts = (key: string) =>
            options && typeof options === "object" && key in options
              ? convertOptions(options[key] as Record<string, unknown>)
              : convertOptions(options);

          const transformMap: Record<
            string,
            { target: unknown; prop: string; multi?: boolean }
          > = {
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

          const animations: Array<{ stop?: () => void }> = [];

          // Helper to create animation with optional callbacks
          const createAnimation = (
            target: Record<string, unknown>,
            props: Record<string, unknown>,
            opts: Record<string, unknown>,
            propertyKey: string,
          ) => {
            const animOpts = callbacks
              ? createCallbackOptions(
                  opts,
                  callbacks,
                  animState,
                  animateVariant,
                  propertyKey,
                )
              : opts;
            animations.push(animateFn(target, props, animOpts));
            if (callbacks) {
              registerAnimation(animState);
            }
          };

          const animateColor = (
            target: unknown,
            value: unknown,
            opts: Record<string, unknown>,
            key: string,
          ) => {
            const ColorConstructor = (
              target as {
                constructor: new (val: unknown) => {
                  r: number;
                  g: number;
                  b: number;
                };
              }
            ).constructor;
            const tempColor = new ColorConstructor(value);
            ["r", "g", "b"].forEach((channel) =>
              createAnimation(
                target as Record<string, unknown>,
                { [channel]: tempColor[channel as keyof typeof tempColor] },
                opts,
                key,
              ),
            );
          };

          Object.entries(targetValues).forEach(([key, value]) => {
            const opts = getPropertyOpts(key);
            const mapping = transformMap[key];

            if (mapping?.target) {
              if (mapping.multi) {
                ["x", "y", "z"].forEach((axis) =>
                  createAnimation(
                    mapping.target as Record<string, unknown>,
                    { [axis]: value },
                    opts,
                    key,
                  ),
                );
              } else {
                createAnimation(
                  mapping.target as Record<string, unknown>,
                  { [mapping.prop]: value },
                  opts,
                  key,
                );
              }
            } else if (key === "color" && instance.color) {
              animateColor(instance.color, value, opts, key);
            } else if (key === "emissive" && instance.emissive) {
              animateColor(instance.emissive, value, opts, key);
            } else if (key === "opacity" && instance.opacity !== undefined) {
              createAnimation(
                instance as Record<string, unknown>,
                { opacity: value },
                opts,
                key,
              );
            } else if (
              key === "emissiveIntensity" &&
              instance.emissiveIntensity !== undefined
            ) {
              createAnimation(
                instance as Record<string, unknown>,
                { emissiveIntensity: value },
                opts,
                key,
              );
            } else if (
              key === "roughness" &&
              instance.roughness !== undefined
            ) {
              createAnimation(
                instance as Record<string, unknown>,
                { roughness: value },
                opts,
                key,
              );
            } else if (
              key === "metalness" &&
              instance.metalness !== undefined
            ) {
              createAnimation(
                instance as Record<string, unknown>,
                { metalness: value },
                opts,
                key,
              );
            }
          });

          animationRef.current = {
            stop: () => animations.forEach((anim) => anim.stop?.()),
          };
        },
        [animate],
      );

      useEffect(() => {
        if (!instanceRef.current || !animate) return;

        const resolved =
          typeof animate === "string" ? resolveVariant(animate) : animate;
        if (!resolved) return;

        const resolvedObj = resolved as Record<string, unknown>;
        const { transition: variantTransition, ...targetValues } = resolvedObj;

        let effectiveTransition = variantTransition || transition;
        const parentTrans = parentContext?.transition as
          | Record<string, unknown>
          | undefined;
        if (
          parentTrans?.delayChildren !== undefined ||
          parentTrans?.staggerChildren !== undefined
        ) {
          const orchestrationDelay =
            ((parentTrans.delayChildren as number) || 0) +
            childIndex * ((parentTrans.staggerChildren as number) || 0);
          effectiveTransition = {
            ...effectiveTransition,
            delay:
              (((effectiveTransition as Record<string, unknown>)
                ?.delay as number) || 0) + orchestrationDelay,
          };
        }

        animateToTarget(
          targetValues,
          effectiveTransition as Record<string, unknown>,
          true, // Enable callbacks for main animations
        );

        return () => animationRef.current?.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [animate]);

      const gestureProps = {
        instanceRef,
        captureInstanceState,
        buildTargetFromState,
        animateToTarget,
        resolveVariant,
        transition,
      };
      const gestureHandlers = {
        ...useHover(
          false,
          props as Props & Record<string, unknown>,
          gestureProps,
        ),
        ...useTap(
          false,
          props as Props & Record<string, unknown>,
          gestureProps,
        ),
      };

      const resolvedInitialValues =
        typeof initial === "string" ? resolveVariant(initial) : initial;

      const element = useRender(
        Component,
        { ...restProps, ...gestureHandlers, children },
        ref,
        instanceRef,
        resolvedInitialValues,
      );

      const getNextChildIndex = useCallback(() => {
        const index = childIndexCounterRef.current;
        childIndexCounterRef.current += 1;
        return index;
      }, []);

      if (initial !== undefined || animate !== undefined || effectiveVariants) {
        const contextValue: MotionContextValue = {
          initial,
          animate,
          variants: effectiveVariants,
          transition,
          custom: effectiveCustom,
          getNextChildIndex,
        };
        return createElement(
          MotionContext.Provider,
          { value: contextValue },
          element,
        );
      }

      return element;
    },
  );

  MotionComponent.displayName = `Motion(${Component})`;

  return memo(MotionComponent);
}

const componentCache = new Map<string, ReturnType<typeof custom>>();
export const motion = new Proxy(custom, {
  get: (_, key: string) => {
    if (!componentCache.has(key)) {
      componentCache.set(key, custom(key));
    }
    return componentCache.get(key)!;
  },
}) as unknown as ThreeMotionComponents;
