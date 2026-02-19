import {
  createElement,
  useCallback,
  ForwardedRef,
  MutableRefObject,
  useRef,
} from "react";
import type { ThreeElement } from "../types";
import { Color, type ColorRepresentation } from "three";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PropertySetter = (val: any) => void;

export const useRender = (
  Component: string,
  props: Record<string, unknown>,
  forwardedRef: ForwardedRef<ThreeElement>,
  instanceRef: MutableRefObject<ThreeElement | null>,
  initialValues?: Record<string, unknown>,
) => {
  const initialValuesAppliedRef = useRef(false);

  /**
   * Create a callback ref that captures the Three.js instance
   */
  const callbackRef = useCallback(
    (instance: ThreeElement | null) => {
      if (!instance) return;

      // Apply initial values immediately to prevent FOUC - but only once
      if (initialValues && !initialValuesAppliedRef.current) {
        initialValuesAppliedRef.current = true;
        // Transform property mapping
        const propertyMap: Record<string, PropertySetter> = {
          x: (val) =>
            instance.position && (instance.position.x = val as number),
          y: (val) =>
            instance.position && (instance.position.y = val as number),
          z: (val) =>
            instance.position && (instance.position.z = val as number),
          rotateX: (val) =>
            instance.rotation && (instance.rotation.x = val as number),
          rotateY: (val) =>
            instance.rotation && (instance.rotation.y = val as number),
          rotateZ: (val) =>
            instance.rotation && (instance.rotation.z = val as number),
          scale: (val) =>
            instance.scale &&
            instance.scale.set(val as number, val as number, val as number),
          scaleX: (val) => instance.scale && (instance.scale.x = val as number),
          scaleY: (val) => instance.scale && (instance.scale.y = val as number),
          scaleZ: (val) => instance.scale && (instance.scale.z = val as number),
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
          } else if (colorKeys.has(key)) {
            const colorProp = instance[key] as Color;
            if (colorProp && colorProp.set) {
              colorProp.set(initialValues[key] as ColorRepresentation);
            }
          } else if (
            instance.uniforms &&
            (instance.uniforms as Record<string, unknown>)[key] &&
            typeof (
              (instance.uniforms as Record<string, Record<string, unknown>>)[
                key
              ] as Record<string, unknown>
            )?.value === "number"
          ) {
            // Set ShaderMaterial uniform initial value
            (instance.uniforms as Record<string, Record<string, unknown>>)[
              key
            ].value = initialValues[key];
          } else if (key in instance && typeof instance[key] === "number") {
            (instance as Record<string, unknown>)[key] = initialValues[key];
          }
        }
      }

      // Store instance in the ref so animations can access it
      instanceRef.current = instance;

      // Call the forwarded ref if it exists
      if (typeof forwardedRef === "function") {
        forwardedRef(instance);
      } else if (forwardedRef) {
        // eslint-disable-next-line react-hooks/immutability, @typescript-eslint/no-explicit-any
        (forwardedRef as any).current = instance;
      }
    },
    [instanceRef, forwardedRef, initialValues],
  );

  return createElement(Component, {
    ref: callbackRef,
    ...props,
  });
};
