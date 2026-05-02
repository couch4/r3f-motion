import type { ThreeEvent, ReactThreeFiber } from "@react-three/fiber";
import type { ThreeMotionProps } from "../../types";
import type { Transition } from "motion/react";
type ThreeMeshProps = ReactThreeFiber.ThreeElements[keyof ReactThreeFiber.ThreeElements];
type ThreeInstance = Record<string, unknown>;
interface UseDragOptions {
    instanceRef: React.RefObject<ThreeInstance | null>;
    captureInstanceState: () => Record<string, unknown> | null;
    buildTargetFromState: (state: Record<string, unknown>) => Record<string, unknown>;
    animateToTarget: (values: Record<string, unknown>, options?: Transition) => void;
    resolveVariant: (key: string) => Record<string, unknown>;
    transition?: Transition;
    stopAnimation: () => void;
}
type ThreeMeshPropsWithDrag = ThreeMotionProps & Partial<ThreeMeshProps>;
export declare function useDrag(isStatic: boolean, props: ThreeMeshPropsWithDrag, options: UseDragOptions): {
    onPointerDown?: undefined;
} | {
    onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
};
export {};
