import {
  createElement,
  useCallback,
  ForwardedRef,
  MutableRefObject,
  useRef,
} from "react";
import type { ThreeElement } from "../types";
import { Color } from "three";

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
        // Property mapping configuration
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
          color: (val) => {
            const color = instance.color as Color;
            if (color && color.set) {
              color.set(val);
            }
          },
          opacity: (val) =>
            instance.opacity !== undefined &&
            (instance.opacity = val as number),
          emissive: (val) => {
            const emissive = instance.emissive as Color;
            if (emissive && emissive.set) {
              emissive.set(val);
            }
          },
          emissiveIntensity: (val) =>
            instance.emissiveIntensity !== undefined &&
            (instance.emissiveIntensity = val as number),
          roughness: (val) =>
            instance.roughness !== undefined &&
            (instance.roughness = val as number),
          metalness: (val) =>
            instance.metalness !== undefined &&
            (instance.metalness = val as number),
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
