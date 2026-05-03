import { type ReactNode } from 'react';
import { useMotionValue, type Transition } from 'motion/react';
import type { DragInfo } from '../../types';
export interface CarouselProps {
    items: ReactNode[];
    itemWidth?: number;
    gap?: number;
    defaultValue?: number;
    transition?: Transition;
    onSwitch?: (index: number) => void;
    onDragStart?: () => void;
    onDrag?: (info: DragInfo) => void;
    onDragEnd?: (info: DragInfo) => void;
    renderThreshold?: number;
    dragThreshold?: number;
    flickVelocity?: number;
}
export interface CarouselSlotInfo {
    slotIndex: number;
    itemIndex: number;
    currIndex: ReturnType<typeof useMotionValue>;
    distance: number;
    isActive: boolean;
    isNearby: boolean;
}
export declare const useCarouselSlot: () => CarouselSlotInfo;
declare const Carousel: ({ items, itemWidth, gap, defaultValue, transition, onSwitch, onDragStart, onDrag, onDragEnd, renderThreshold, dragThreshold, flickVelocity, ...props }: CarouselProps) => import("react/jsx-runtime").JSX.Element;
declare const _default: typeof Carousel;
export default _default;
