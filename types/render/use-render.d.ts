import { ForwardedRef, MutableRefObject } from "react";
import type { ThreeElement } from "../types";
export declare const useRender: (Component: string, props: Record<string, unknown>, forwardedRef: ForwardedRef<ThreeElement>, instanceRef: MutableRefObject<ThreeElement | null>, initialValues?: Record<string, unknown>) => import("react").ReactElement<{
    ref: (instance: ThreeElement | null) => void;
}, string | import("react").JSXElementConstructor<any>>;
