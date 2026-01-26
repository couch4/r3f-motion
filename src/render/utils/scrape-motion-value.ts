import { isMotionValue } from "motion/react";
import { ThreeMotionProps } from "../../types";

const axes = ["x", "y", "z"];

const valueMap: Record<string, string> = {
  "position-x": "x",
  "position-y": "y",
  "position-z": "z",
  "rotation-x": "rotateX",
  "rotation-y": "rotateY",
  "rotation-z": "rotateZ",
  "scale-x": "scaleX",
  "scale-y": "scaleY",
  "scale-z": "scaleZ",
};

export const scrapeMotionValuesFromProps = (
  props: ThreeMotionProps,
  prevProps: ThreeMotionProps,
) => {
  const motionValues: Record<string, unknown> = {};

  for (const key in props) {
    const prop = props[key];

    if (isMotionValue(prop) || isMotionValue(prevProps[key])) {
      motionValues[valueMap[key] || key] = prop;
    } else if (Array.isArray(prop)) {
      for (let i = 0; i < prop.length; i++) {
        const value = prop[i];
        if (
          isMotionValue(value) ||
          (Array.isArray(prevProps[key]) && isMotionValue(prevProps[key][i]))
        ) {
          const name = valueMap[key + "-" + axes[i]];
          motionValues[name] = value;
        }
      }
    }
  }

  return motionValues;
};
