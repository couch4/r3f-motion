import type { ThreeElement, ThreeRenderState } from "../../types";
import { Euler, Vector3, Color } from "three";

const setVector =
  (name: string, defaultValue: number) =>
  (i: number) =>
  (instance: ThreeElement, value: number) => {
    if (instance[name] === undefined) {
      instance[name] = new Vector3(defaultValue);
    }
    const vector = instance[name] as Vector3;
    vector.setComponent(i, value);
  };

const setEuler =
  (name: string, defaultValue: number) =>
  (axis: string) =>
  (instance: ThreeElement, value: number) => {
    if ((instance as any)[name] === undefined) {
      (instance as any)[name] = new Euler(defaultValue);
    }
    const euler = (instance as any)[name] as Euler;
    (euler as any)[axis] = value;
  };

const setColor = (name: string) => (instance: ThreeElement, value: string) => {
  if ((instance as any)[name] === undefined) {
    (instance as any)[name] = new Color(value);
  }
  (instance as any)[name].set(value);
};

const setScale = setVector("scale", 1);
const setPosition = setVector("position", 0);
const setRotation = setEuler("rotation", 0);

const setters: Record<string, (instance: ThreeElement, value: any) => void> = {
  x: setPosition(0),
  y: setPosition(1),
  z: setPosition(2),
  scale: (instance: ThreeElement, value: number) => {
    // instance.scale is always defined on Object3D, no need to check
    const scale = instance.scale as Vector3;
    scale.set(value, value, value);
  },
  scaleX: setScale(0),
  scaleY: setScale(1),
  scaleZ: setScale(2),
  rotateX: setRotation("x"),
  rotateY: setRotation("y"),
  rotateZ: setRotation("z"),
  color: setColor("color"),
  specular: setColor("specular"),
};

export function setThreeValue(
  instance: ThreeElement,
  key: string,
  values: ThreeRenderState,
): void {
  const setter = setters[key];
  if (setter) {
    setter(instance, values[key]);
  } else {
    if (key === "opacity" && !instance.transparent) {
      instance.transparent = true;
    }

    instance[key] = values[key];
  }
}
