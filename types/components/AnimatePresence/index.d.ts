import { type ReactNode } from "react";
import { type PresenceContextValue } from "./PresenceContext";
interface AnimatePresenceProps {
    children?: ReactNode;
    /**
     * If `true`, `AnimatePresence` will only render one component
     * at a time. The exiting component will finish its exit animation
     * before the entering component is rendered.
     *
     * @default "sync"
     */
    mode?: "sync" | "wait";
    /**
     * Fires when all exiting children have finished animating out.
     */
    onExitComplete?: () => void;
    /**
     * Custom data to pass to exiting children via the presence context.
     */
    custom?: unknown;
}
export declare function AnimatePresence({ children, mode, onExitComplete, custom, }: AnimatePresenceProps): import("react").FunctionComponentElement<import("react").ProviderProps<PresenceContextValue | null>>[];
export {};
