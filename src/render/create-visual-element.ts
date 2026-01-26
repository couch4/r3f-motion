import type {
  TargetAndTransition,
  ResolvedValues,
  MotionProps,
  VisualElementOptions,
  MotionValue,
} from "motion/react";

import { createBox, VisualElement } from "motion/react";
import type {
  ThreeElement,
  ThreeRenderState,
  ThreeMotionProps,
} from "../types";

import { setThreeValue } from "./utils/set-value";
import { readThreeValue } from "./utils/read-value";
import { scrapeMotionValuesFromProps } from "./utils/scrape-motion-value";

export const createRenderState = (): ThreeRenderState => ({});

export class ThreeVisualElement extends VisualElement<
  ThreeElement,
  ThreeRenderState,
  Record<string, never>
> {
  type = "three";

  readValueFromInstance(instance: ThreeElement, key: string) {
    return readThreeValue(instance, key);
  }

  getBaseTargetFromProps() {
    return undefined;
  }

  sortInstanceNodePosition(a: ThreeElement, b: ThreeElement) {
    return a.id - b.id;
  }

  makeTargetAnimatableFromInstance({
    transition,
    transitionEnd,
    ...target
  }: TargetAndTransition) {
    // Motion v12 - simplified target processing
    return { ...target, transition, transitionEnd };
  }

  removeValueFromRenderState() {}

  measureInstanceViewportBox() {
    return createBox();
  }

  scrapeMotionValuesFromProps(props: MotionProps, prevProps: MotionProps) {
    return scrapeMotionValuesFromProps(
      props as unknown as ThreeMotionProps,
      prevProps as unknown as ThreeMotionProps,
    ) as Record<string, MotionValue>;
  }

  build(state: ThreeRenderState, latestValues: ResolvedValues) {
    for (const key in latestValues) {
      state[key] = latestValues[key];
    }
  }

  renderInstance(instance: ThreeElement, renderState: ThreeRenderState) {
    console.log("renderInstance called by motion system", {
      instance,
      renderState,
    });
    for (const key in renderState) {
      setThreeValue(instance, key, renderState as ThreeRenderState);
    }
  }
}

export const createVisualElement = (
  _: unknown,
  options: VisualElementOptions<ThreeElement, ThreeRenderState>,
) => new ThreeVisualElement(options, {});
