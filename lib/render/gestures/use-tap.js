import { useCallback, useRef } from "react";
export function useTap(isStatic, props, options) {
    const { whileTap, onTapStart, onTap, onTapCancel, onPointerDown, onPointerUp, } = props;
    const { captureInstanceState, buildTargetFromState, animateToTarget, resolveVariant, transition, } = options;
    const preTapStateRef = useRef(null);
    const returnTimeoutRef = useRef(null);
    const handlePointerDown = useCallback((event) => {
        if (whileTap) {
            if (returnTimeoutRef.current) {
                clearTimeout(returnTimeoutRef.current);
                returnTimeoutRef.current = null;
            }
            if (!preTapStateRef.current) {
                preTapStateRef.current = captureInstanceState();
            }
            const targetValues = typeof whileTap === "string"
                ? resolveVariant(whileTap)
                : whileTap;
            animateToTarget(targetValues, transition || { duration: 0.2 });
        }
        onTapStart === null || onTapStart === void 0 ? void 0 : onTapStart(event.nativeEvent, {
            point: {
                x: event.nativeEvent.clientX,
                y: event.nativeEvent.clientY,
            },
        });
        onPointerDown === null || onPointerDown === void 0 ? void 0 : onPointerDown(event);
    }, [
        whileTap,
        onTapStart,
        onPointerDown,
        captureInstanceState,
        resolveVariant,
        animateToTarget,
        transition,
    ]);
    const handlePointerUp = useCallback((event) => {
        if (whileTap && preTapStateRef.current) {
            const targetValues = buildTargetFromState(preTapStateRef.current);
            animateToTarget(targetValues, transition || { duration: 0.2 });
            returnTimeoutRef.current = setTimeout(() => {
                preTapStateRef.current = null;
                returnTimeoutRef.current = null;
            }, ((transition === null || transition === void 0 ? void 0 : transition.duration) || 0.2) * 1000);
            onTap === null || onTap === void 0 ? void 0 : onTap(event.nativeEvent, {
                point: {
                    x: event.nativeEvent.clientX,
                    y: event.nativeEvent.clientY,
                },
            });
        }
        onPointerUp === null || onPointerUp === void 0 ? void 0 : onPointerUp(event);
    }, [
        whileTap,
        onTap,
        onPointerUp,
        buildTargetFromState,
        animateToTarget,
        transition,
    ]);
    const handlePointerCancel = useCallback((event) => {
        if (whileTap && preTapStateRef.current) {
            const targetValues = buildTargetFromState(preTapStateRef.current);
            animateToTarget(targetValues, transition || { duration: 0.2 });
            returnTimeoutRef.current = setTimeout(() => {
                preTapStateRef.current = null;
                returnTimeoutRef.current = null;
            }, ((transition === null || transition === void 0 ? void 0 : transition.duration) || 0.2) * 1000);
            onTapCancel === null || onTapCancel === void 0 ? void 0 : onTapCancel(event.nativeEvent, {
                point: {
                    x: event.nativeEvent.clientX,
                    y: event.nativeEvent.clientY,
                },
            });
        }
    }, [whileTap, onTapCancel, buildTargetFromState, animateToTarget, transition]);
    const isTapEnabled = onTap || onTapStart || onTapCancel || whileTap;
    if (isStatic || !isTapEnabled)
        return {};
    return {
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerCancel,
    };
}
//# sourceMappingURL=use-tap.js.map