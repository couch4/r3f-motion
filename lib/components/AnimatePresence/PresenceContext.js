import { createContext, useContext } from "react";
export const PresenceContext = createContext(null);
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
export function usePresence() {
    const context = useContext(PresenceContext);
    if (!context)
        return null;
    return [context.isPresent, context.safeToRemove];
}
//# sourceMappingURL=PresenceContext.js.map