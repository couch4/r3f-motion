import { useCallback, useRef } from "react";
import type { ThreeEvent, ReactThreeFiber } from "@react-three/fiber";
import type { ThreeMotionProps } from "../../types";
import type { Transition } from "motion/react";

type ThreeMeshProps =
  ReactThreeFiber.ThreeElements[keyof ReactThreeFiber.ThreeElements];
type ThreeInstance = Record<string, unknown>;

interface UseHoverOptions {
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

type ThreeMeshPropsWithHover = ThreeMotionProps & Partial<ThreeMeshProps>;

export function useHover(
  isStatic: boolean,
  props: ThreeMeshPropsWithHover,
  options: UseHoverOptions,
) {
  const { whileHover, onHoverStart, onHoverEnd, onPointerOver, onPointerOut } =
    props;

  const {
    captureInstanceState,
    buildTargetFromState,
    animateToTarget,
    resolveVariant,
    transition,
  } = options;

  const preHoverStateRef = useRef<Record<string, unknown> | null>(null);
  const returnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerEnter = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (whileHover) {
        if (returnTimeoutRef.current) {
          clearTimeout(returnTimeoutRef.current);
          returnTimeoutRef.current = null;
        }

        if (!preHoverStateRef.current) {
          preHoverStateRef.current = captureInstanceState();
        }

        const targetValues =
          typeof whileHover === "string"
            ? resolveVariant(whileHover)
            : whileHover;
        animateToTarget(
          targetValues as Record<string, unknown>,
          transition || { duration: 0.2 },
        );
      }
      onHoverStart?.(event.nativeEvent, {
        point: {
          x: event.nativeEvent.clientX,
          y: event.nativeEvent.clientY,
        },
      });
      onPointerOver?.(event);
    },
    [
      whileHover,
      onHoverStart,
      onPointerOver,
      captureInstanceState,
      resolveVariant,
      animateToTarget,
      transition,
    ],
  );

  const handlePointerLeave = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (whileHover && preHoverStateRef.current) {
        const targetValues = buildTargetFromState(preHoverStateRef.current);
        animateToTarget(targetValues, transition || { duration: 0.2 });

        returnTimeoutRef.current = setTimeout(
          () => {
            preHoverStateRef.current = null;
            returnTimeoutRef.current = null;
          },
          ((transition?.duration as number) || 0.2) * 1000,
        );
      }
      onHoverEnd?.(event.nativeEvent, {
        point: {
          x: event.nativeEvent.clientX,
          y: event.nativeEvent.clientY,
        },
      });
      onPointerOut?.(event);
    },
    [
      whileHover,
      onHoverEnd,
      onPointerOut,
      buildTargetFromState,
      animateToTarget,
      transition,
    ],
  );

  const isHoverEnabled = whileHover || onHoverStart || onHoverEnd;

  if (isStatic || !isHoverEnabled) return {};

  return {
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
  };
}
