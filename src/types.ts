import type {
  Color,
  Euler,
  Vector3,
  ReactThreeFiber,
} from "@react-three/fiber";
import * as THREE from "three";
import type {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from "react";
import type { MotionValue, ResolvedValues, MotionProps } from "motion/react";

// Type alias for Three.js elements (replaces Object3DNode from older @react-three/fiber)
export type ThreeElement = InstanceType<typeof THREE.Object3D> &
  Record<string, unknown>;

export interface ThreeMotionProps extends Omit<
  MotionProps,
  "style" | "children" | "onUpdate" | "onAnimationStart" | "onAnimationComplete"
> {
  [key: string]: unknown;
  onInstanceUpdate?: ReactThreeFiber.ThreeElements["object3D"]["onUpdate"];
  onUpdate?: (
    values: Record<string, unknown>,
    animationVariant?: string,
  ) => void;
  onAnimationStart?: (
    values: Record<string, unknown>,
    animationVariant?: string,
  ) => void;
  onAnimationComplete?: (
    values: Record<string, unknown>,
    animationVariant?: string,
  ) => void;
}

export interface ThreeRenderState {
  [key: string]: unknown;
  latestValues?: ResolvedValues;
}

/**
 * @public
 */
export type ForwardRefComponent<T, P> = ForwardRefExoticComponent<
  PropsWithoutRef<P> & RefAttributes<T>
>;

type MotionValueOrNumber = number | MotionValue<number>;
type MotionValueVector3 = [
  MotionValueOrNumber,
  MotionValueOrNumber,
  MotionValueOrNumber,
];

export type AcceptMotionValues<T> = Omit<
  T,
  "position" | "scale" | "rotation" | "color"
> & {
  position?: Vector3 | MotionValueVector3 | MotionValueOrNumber;
  scale?: Vector3 | MotionValueVector3 | MotionValueOrNumber;
  rotation?: Euler | MotionValueVector3 | MotionValueOrNumber;
  color?: Color | MotionValue<string>;
};

/**
 * Motion-optimised versions of React's HTML components.
 *
 * @public
 */
export type ThreeMotionComponents = {
  [K in keyof ReactThreeFiber.ThreeElements]: ForwardRefComponent<
    ReactThreeFiber.ThreeElements[K] extends ReactThreeFiber.ThreeElement<
      infer T extends new (...args: unknown[]) => THREE.Object3D
    >
      ? InstanceType<T>
      : THREE.Object3D,
    ThreeMotionProps &
      Omit<
        AcceptMotionValues<ReactThreeFiber.ThreeElements[K]>,
        "onUpdate" | "transition"
      >
  >;
};
