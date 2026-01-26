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
export declare function createAnimationState(): AnimationState;
export declare function createCallbackOptions(baseOpts: Record<string, unknown>, callbacks: AnimationCallbacks | undefined, state: AnimationState, variant?: string | Record<string, unknown>, propertyKey?: string): Record<string, unknown>;
export declare function registerAnimation(state: AnimationState): void;
