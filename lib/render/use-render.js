import { createElement, useCallback, useRef, } from "react";
export const useRender = (Component, props, forwardedRef, instanceRef, initialValues) => {
    const initialValuesAppliedRef = useRef(false);
    /**
     * Create a callback ref that captures the Three.js instance
     */
    const callbackRef = useCallback((instance) => {
        var _a;
        if (!instance)
            return;
        // Apply initial values immediately to prevent FOUC - but only once
        if (initialValues && !initialValuesAppliedRef.current) {
            initialValuesAppliedRef.current = true;
            // Transform property mapping
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
            };
            // Color-type properties that need .set()
            const colorKeys = new Set([
                "color",
                "emissive",
                "specular",
                "sheenColor",
                "attenuationColor",
            ]);
            for (const key in initialValues) {
                const setter = propertyMap[key];
                if (setter) {
                    setter(initialValues[key]);
                }
                else if (colorKeys.has(key)) {
                    const colorProp = instance[key];
                    if (colorProp && colorProp.set) {
                        colorProp.set(initialValues[key]);
                    }
                }
                else if (instance.uniforms &&
                    instance.uniforms[key] &&
                    typeof ((_a = instance.uniforms[key]) === null || _a === void 0 ? void 0 : _a.value) === "number") {
                    // Set ShaderMaterial uniform initial value
                    instance.uniforms[key].value = initialValues[key];
                }
                else if (key in instance && typeof instance[key] === "number") {
                    instance[key] = initialValues[key];
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