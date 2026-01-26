import { useCallback, useRef } from "react";
export function useHover(isStatic, props, options) {
    const { whileHover, onHoverStart, onHoverEnd, onPointerOver, onPointerOut } = props;
    const { captureInstanceState, buildTargetFromState, animateToTarget, resolveVariant, transition, } = options;
    const preHoverStateRef = useRef(null);
    const returnTimeoutRef = useRef(null);
    const handlePointerEnter = useCallback((event) => {
        if (whileHover) {
            if (returnTimeoutRef.current) {
                clearTimeout(returnTimeoutRef.current);
                returnTimeoutRef.current = null;
            }
            if (!preHoverStateRef.current) {
                preHoverStateRef.current = captureInstanceState();
            }
            const targetValues = typeof whileHover === "string"
                ? resolveVariant(whileHover)
                : whileHover;
            animateToTarget(targetValues, transition || { duration: 0.2 });
        }
        onHoverStart === null || onHoverStart === void 0 ? void 0 : onHoverStart(event.nativeEvent, {
            point: {
                x: event.nativeEvent.clientX,
                y: event.nativeEvent.clientY,
            },
        });
        onPointerOver === null || onPointerOver === void 0 ? void 0 : onPointerOver(event);
    }, [
        whileHover,
        onHoverStart,
        onPointerOver,
        captureInstanceState,
        resolveVariant,
        animateToTarget,
        transition,
    ]);
    const handlePointerLeave = useCallback((event) => {
        if (whileHover && preHoverStateRef.current) {
            const targetValues = buildTargetFromState(preHoverStateRef.current);
            animateToTarget(targetValues, transition || { duration: 0.2 });
            returnTimeoutRef.current = setTimeout(() => {
                preHoverStateRef.current = null;
                returnTimeoutRef.current = null;
            }, ((transition === null || transition === void 0 ? void 0 : transition.duration) || 0.2) * 1000);
        }
        onHoverEnd === null || onHoverEnd === void 0 ? void 0 : onHoverEnd(event.nativeEvent, {
            point: {
                x: event.nativeEvent.clientX,
                y: event.nativeEvent.clientY,
            },
        });
        onPointerOut === null || onPointerOut === void 0 ? void 0 : onPointerOut(event);
    }, [
        whileHover,
        onHoverEnd,
        onPointerOut,
        buildTargetFromState,
        animateToTarget,
        transition,
    ]);
    const isHoverEnabled = whileHover || onHoverStart || onHoverEnd;
    if (isStatic || !isHoverEnabled)
        return {};
    return {
        onPointerEnter: handlePointerEnter,
        onPointerLeave: handlePointerLeave,
    };
}
//# sourceMappingURL=use-hover.js.map