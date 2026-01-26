import type { ThreeEvent, ReactThreeFiber } from "@react-three/fiber";
import type { ThreeMotionProps } from "../../types";
import type { Transition } from "motion/react";
type ThreeMeshProps = ReactThreeFiber.ThreeElements[keyof ReactThreeFiber.ThreeElements];
type ThreeInstance = Record<string, unknown>;
interface UseTapOptions {
    instanceRef: React.RefObject<ThreeInstance | null>;
    captureInstanceState: () => Record<string, unknown> | null;
    buildTargetFromState: (state: Record<string, unknown>) => Record<string, unknown>;
    animateToTarget: (values: Record<string, unknown>, options?: Transition) => void;
    resolveVariant: (key: string) => Record<string, unknown>;
    transition?: Transition;
}
type ThreeMeshPropsWithTap = ThreeMotionProps & Partial<ThreeMeshProps>;
export declare function useTap(isStatic: boolean, props: ThreeMeshPropsWithTap, options: UseTapOptions): {
    onPointerDown?: undefined;
    onPointerUp?: undefined;
    onPointerCancel?: undefined;
} | {
    onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
    onPointerUp: (event: ThreeEvent<PointerEvent>) => void;
    onPointerCancel: (event: ThreeEvent<PointerEvent>) => void;
};
export {};
