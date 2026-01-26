export function createAnimationState() {
    return {
        hasStarted: false,
        completedCount: 0,
        totalAnimations: [],
        latestValues: {},
    };
}
export function createCallbackOptions(baseOpts, callbacks, state, variant, propertyKey) {
    if (!callbacks)
        return baseOpts;
    const { onAnimationUpdate, onAnimationStart, onAnimationComplete } = callbacks;
    const variantString = typeof variant === "string" ? variant : undefined;
    return Object.assign(Object.assign({}, baseOpts), { onUpdate: onAnimationUpdate
            ? (latest) => {
                // Fire onAnimationStart once on first update
                if (!state.hasStarted && onAnimationStart) {
                    state.hasStarted = true;
                    onAnimationStart(variantString);
                }
                // Accumulate values by property key
                if (propertyKey) {
                    state.latestValues[propertyKey] = latest;
                }
                // Pass accumulated values object to user callback
                onAnimationUpdate(state.latestValues, variantString);
            }
            : onAnimationStart
                ? () => {
                    // If only onAnimationStart is provided, still fire it
                    if (!state.hasStarted) {
                        state.hasStarted = true;
                        onAnimationStart(variantString);
                    }
                }
                : undefined, onComplete: () => {
            state.completedCount++;
            if (state.completedCount === state.totalAnimations.length &&
                onAnimationComplete) {
                onAnimationComplete(variantString);
            }
        } });
}
export function registerAnimation(state) {
    state.totalAnimations.push(1);
}
//# sourceMappingURL=index.js.map