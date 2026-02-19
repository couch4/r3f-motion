export interface PresenceContextValue {
    isPresent: boolean;
    safeToRemove: () => void;
    custom?: unknown;
}
export declare const PresenceContext: import("react").Context<PresenceContextValue | null>;
/**
 * Returns presence information for the current component.
 *
 * - `isPresent`: Whether the component is currently present in the tree.
 *   When `false`, the component is exiting and should play its exit animation.
 * - `safeToRemove`: Call this function when the exit animation is complete
 *   to signal that the component can be unmounted.
 *
 * Returns `null` if the component is not wrapped in `AnimatePresence`.
 */
export declare function usePresence(): [boolean, () => void] | null;
