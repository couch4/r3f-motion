import { createElement, useCallback, useRef, } from "react";
export const useRender = (Component, props, forwardedRef, instanceRef, initialValues) => {
    const initialValuesAppliedRef = useRef(false);
    /**
     * Create a callback ref that captures the Three.js instance
     */
    const callbackRef = useCallback((instance) => {
        if (!instance)
            return;
        // Apply initial values immediately to prevent FOUC - but only once
        if (initialValues && !initialValuesAppliedRef.current) {
            initialValuesAppliedRef.current = true;
            // Property mapping configuration
            const propertyMap = {
                x: (val) => instance.position && (instance.position.x = val),
                y: (val) => instance.position && (instance.position.y = val),
                z: (val) => instance.position && (instance.position.z = val),
                rotateX: (val) => instance.rotation && (instance.rotation.x = val),
                rotateY: (val) => instance.rotation && (instance.rotation.y = val),
                rotateZ: (val) => instance.rotation && (instance.rotation.z = val),
                scale: (val) => instance.scale &&
                    instance.scale.set(val, val, val),
                scaleX: (val) => instance.scale && (instance.scale.x = val),
                scaleY: (val) => instance.scale && (instance.scale.y = val),
                scaleZ: (val) => instance.scale && (instance.scale.z = val),
                color: (val) => {
                    const color = instance.color;
                    if (color && color.set) {
                        color.set(val);
                    }
                },
                opacity: (val) => instance.opacity !== undefined &&
                    (instance.opacity = val),
                emissive: (val) => {
                    const emissive = instance.emissive;
                    if (emissive && emissive.set) {
                        emissive.set(val);
                    }
                },
                emissiveIntensity: (val) => instance.emissiveIntensity !== undefined &&
                    (instance.emissiveIntensity = val),
                roughness: (val) => instance.roughness !== undefined &&
                    (instance.roughness = val),
                metalness: (val) => instance.metalness !== undefined &&
                    (instance.metalness = val),
            };
            for (const key in initialValues) {
                const setter = propertyMap[key];
                if (setter) {
                    setter(initialValues[key]);
                }
            }
        }
        // Store instance in the ref so animations can access it
        instanceRef.current = instance;
        // Call the forwarded ref if it exists
        if (typeof forwardedRef === "function") {
            forwardedRef(instance);
        }
        else if (forwardedRef) {
            // eslint-disable-next-line react-hooks/immutability, @typescript-eslint/no-explicit-any
            forwardedRef.current = instance;
        }
    }, [instanceRef, forwardedRef, initialValues]);
    return createElement(Component, Object.assign({ ref: callbackRef }, props));
};
//# sourceMappingURL=use-render.js.map