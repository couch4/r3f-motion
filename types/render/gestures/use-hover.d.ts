import type { ThreeEvent, ReactThreeFiber } from "@react-three/fiber";
import type { ThreeMotionProps } from "../../types";
import type { Transition } from "motion/react";
type ThreeMeshProps = ReactThreeFiber.ThreeElements[keyof ReactThreeFiber.ThreeElements];
type ThreeInstance = Record<string, unknown>;
interface UseHoverOptions {
    instanceRef: React.RefObject<ThreeInstance | null>;
    captureInstanceState: () => Record<string, unknown> | null;
    buildTargetFromState: (state: Record<string, unknown>) => Record<string, unknown>;
    animateToTarget: (values: Record<string, unknown>, options?: Transition) => void;
    resolveVariant: (key: string) => Record<string, unknown>;
    transition?: Transition;
}
type ThreeMeshPropsWithHover = ThreeMotionProps & Partial<ThreeMeshProps>;
export declare function useHover(isStatic: boolean, props: ThreeMeshPropsWithHover, options: UseHoverOptions): {
    onPointerEnter?: undefined;
    onPointerLeave?: undefined;
} | {
    onPointerEnter: (event: ThreeEvent<MouseEvent>) => void;
    onPointerLeave: (event: ThreeEvent<MouseEvent>) => void;
};
export {};
