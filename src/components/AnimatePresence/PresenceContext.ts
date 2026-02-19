import { createContext, useContext } from "react";

export interface PresenceContextValue {
  isPresent: boolean;
  safeToRemove: () => void;
  custom?: unknown;
}

export const PresenceContext = createContext<PresenceContextValue | null>(null);

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
export function usePresence(): [boolean, () => void] | null {
  const context = useContext(PresenceContext);
  if (!context) return null;
  return [context.isPresent, context.safeToRemove];
}
