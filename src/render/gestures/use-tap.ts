import { useCallback, useRef } from "react";
import type { ThreeEvent, ReactThreeFiber } from "@react-three/fiber";
import type { ThreeMotionProps } from "../../types";
import type { Transition } from "motion/react";

type ThreeMeshProps =
  ReactThreeFiber.ThreeElements[keyof ReactThreeFiber.ThreeElements];
type ThreeInstance = Record<string, unknown>;

interface UseTapOptions {
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
}

type ThreeMeshPropsWithTap = ThreeMotionProps & Partial<ThreeMeshProps>;

export function useTap(
  isStatic: boolean,
  props: ThreeMeshPropsWithTap,
  options: UseTapOptions,
) {
  const {
    whileTap,
    onTapStart,
    onTap,
    onTapCancel,
    onPointerDown,
    onPointerUp,
  } = props;

  const {
    captureInstanceState,
    buildTargetFromState,
    animateToTarget,
    resolveVariant,
    transition,
  } = options;

  const preTapStateRef = useRef<Record<string, unknown> | null>(null);
  const returnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (whileTap) {
        if (returnTimeoutRef.current) {
          clearTimeout(returnTimeoutRef.current);
          returnTimeoutRef.current = null;
        }

        if (!preTapStateRef.current) {
          preTapStateRef.current = captureInstanceState();
        }

        const targetValues =
          typeof whileTap === "string"
            ? resolveVariant(whileTap)
            : (whileTap as Record<string, unknown>);
        animateToTarget(targetValues, transition || { duration: 0.2 });
      }
      onTapStart?.(event.nativeEvent, {
        point: {
          x: event.nativeEvent.clientX,
          y: event.nativeEvent.clientY,
        },
      });
      onPointerDown?.(event);
    },
    [
      whileTap,
      onTapStart,
      onPointerDown,
      captureInstanceState,
      resolveVariant,
      animateToTarget,
      transition,
    ],
  );

  const handlePointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (whileTap && preTapStateRef.current) {
        const targetValues = buildTargetFromState(preTapStateRef.current);
        animateToTarget(targetValues, transition || { duration: 0.2 });

        returnTimeoutRef.current = setTimeout(
          () => {
            preTapStateRef.current = null;
            returnTimeoutRef.current = null;
          },
          ((transition?.duration as number) || 0.2) * 1000,
        );

        onTap?.(event.nativeEvent, {
          point: {
            x: event.nativeEvent.clientX,
            y: event.nativeEvent.clientY,
          },
        });
      }
      onPointerUp?.(event);
    },
    [
      whileTap,
      onTap,
      onPointerUp,
      buildTargetFromState,
      animateToTarget,
      transition,
    ],
  );

  const handlePointerCancel = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (whileTap && preTapStateRef.current) {
        const targetValues = buildTargetFromState(preTapStateRef.current);
        animateToTarget(targetValues, transition || { duration: 0.2 });

        returnTimeoutRef.current = setTimeout(
          () => {
            preTapStateRef.current = null;
            returnTimeoutRef.current = null;
          },
          ((transition?.duration as number) || 0.2) * 1000,
        );

        onTapCancel?.(event.nativeEvent, {
          point: {
            x: event.nativeEvent.clientX,
            y: event.nativeEvent.clientY,
          },
        });
      }
    },
    [whileTap, onTapCancel, buildTargetFromState, animateToTarget, transition],
  );

  const isTapEnabled = onTap || onTapStart || onTapCancel || whileTap;

  if (isStatic || !isTapEnabled) return {};

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
  };
}
