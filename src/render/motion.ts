import { MotionProps } from "motion/react";
import {
  useRef,
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

const MotionContext = createContext<MotionContextValue | null>(null);

function custom<Props>(Component: string) {
  const MotionComponent = forwardRef<ThreeElement, Props & MotionProps>(
    (props, ref) => {
      const instanceRef = useRef<ThreeElement | null>(null);
      const animationRef = useRef<AnimationControl | null>(null);
      const childIndexCounterRef = useRef<number>(0);

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
        ...restProps
      } = props as Props & MotionProps;

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
        ) => {
          const instance = instanceRef.current;
          if (!instance || !targetValues) return;

          animationRef.current?.stop();

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

          const animateColor = (
            target: unknown,
            value: unknown,
            opts: Record<string, unknown>,
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
              animations.push(
                animateFn(
                  target as Record<string, unknown>,
                  { [channel]: tempColor[channel as keyof typeof tempColor] },
                  opts,
                ),
              ),
            );
          };

          Object.entries(targetValues).forEach(([key, value]) => {
            const opts = getPropertyOpts(key);
            const mapping = transformMap[key];

            if (mapping?.target) {
              if (mapping.multi) {
                ["x", "y", "z"].forEach((axis) =>
                  animations.push(
                    animateFn(
                      mapping.target as Record<string, unknown>,
                      { [axis]: value },
                      opts,
                    ),
                  ),
                );
              } else {
                animations.push(
                  animateFn(
                    mapping.target as Record<string, unknown>,
                    { [mapping.prop]: value },
                    opts,
                  ),
                );
              }
            } else if (key === "color" && instance.color) {
              animateColor(instance.color, value, opts);
            } else if (key === "emissive" && instance.emissive) {
              animateColor(instance.emissive, value, opts);
            } else if (key === "opacity" && instance.opacity !== undefined) {
              animations.push(
                animateFn(
                  instance as Record<string, unknown>,
                  { opacity: value },
                  opts,
                ),
              );
            } else if (
              key === "emissiveIntensity" &&
              instance.emissiveIntensity !== undefined
            ) {
              animations.push(
                animateFn(
                  instance as Record<string, unknown>,
                  { emissiveIntensity: value },
                  opts,
                ),
              );
            } else if (
              key === "roughness" &&
              instance.roughness !== undefined
            ) {
              animations.push(
                animateFn(
                  instance as Record<string, unknown>,
                  { roughness: value },
                  opts,
                ),
              );
            } else if (
              key === "metalness" &&
              instance.metalness !== undefined
            ) {
              animations.push(
                animateFn(
                  instance as Record<string, unknown>,
                  { metalness: value },
                  opts,
                ),
              );
            }
          });

          animationRef.current = {
            stop: () => animations.forEach((anim) => anim.stop?.()),
          };
        },
        [],
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
        );
        return () => animationRef.current?.stop();
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
      const gestureHandlers = {
        ...useHover(
          false,
          props as Props & MotionProps & Record<string, unknown>,
          gestureProps,
        ),
        ...useTap(
          false,
          props as Props & MotionProps & Record<string, unknown>,
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

  return MotionComponent;
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
