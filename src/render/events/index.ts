export interface AnimationCallbacks {
  onAnimationUpdate?: (value?: unknown, variant?: string) => void;
  onAnimationStart?: (variant?: string) => void;
  onAnimationComplete?: (variant?: string) => void;
}

export interface AnimationState {
  hasStarted: boolean;
  completedCount: number;
  totalAnimations: number[];
  latestValues: Record<string, unknown>;
}

export function createAnimationState(): AnimationState {
  return {
    hasStarted: false,
    completedCount: 0,
    totalAnimations: [],
    latestValues: {},
  };
}

export function createCallbackOptions(
  baseOpts: Record<string, unknown>,
  callbacks: AnimationCallbacks | undefined,
  state: AnimationState,
  variant?: string | Record<string, unknown>,
  propertyKey?: string,
): Record<string, unknown> {
  if (!callbacks) return baseOpts;
  const { onAnimationUpdate, onAnimationStart, onAnimationComplete } =
    callbacks;

  const variantString = typeof variant === "string" ? variant : undefined;

  return {
    ...baseOpts,
    onUpdate: onAnimationUpdate
      ? (latest: unknown) => {
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
        : undefined,
    onComplete: () => {
      state.completedCount++;
      if (
        state.completedCount === state.totalAnimations.length &&
        onAnimationComplete
      ) {
        onAnimationComplete(variantString);
      }
    },
  };
}

export function registerAnimation(state: AnimationState): void {
  state.totalAnimations.push(1);
}
