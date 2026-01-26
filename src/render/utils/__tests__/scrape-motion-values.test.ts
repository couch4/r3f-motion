import { motionValue } from "motion/react";
import { scrapeMotionValuesFromProps } from "../scrape-motion-value";
import { describe, test, expect } from "vitest";
import { ThreeMotionProps } from "../../../types";

describe("scrapeMotionValuesFromProps", () => {
  test("Scrapes motion values from props", () => {
    const x = motionValue(0);
    const z = motionValue(0);
    const scale = motionValue(0);
    const scaleZ = motionValue(0);
    const rotateX = motionValue(0);
    const rotateZ = motionValue(0);
    const color = motionValue("#fff");

    expect(
      scrapeMotionValuesFromProps(
        {
          "position-x": x,
          scale,
          "position-y": 100,
          "scale-z": scaleZ,
          position: [0, 0, z],
          rotation: [rotateX, 0, rotateZ],
          color,
          prev: 1,
        } as ThreeMotionProps,
        {
          prev: motionValue(0),
        } as ThreeMotionProps,
      ),
    ).toEqual({
      x,
      z,
      scale,
      scaleZ,
      rotateX,
      rotateZ,
      color,
      prev: 1,
    });
  });
});
