import { vi, beforeEach } from "vitest";

// Mock scheduler for motion animations
const callbacks: Array<{ callback: Function; priority: number }> = [];
let currentTime = 0;

vi.mock("scheduler", () => ({
  unstable_scheduleCallback: vi.fn((priority: number, callback: Function) => {
    callbacks.push({ callback, priority });
    // Execute callback immediately for tests
    setTimeout(() => {
      const index = callbacks.findIndex((c) => c.callback === callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
        callback();
      }
    }, 0);
    return callback;
  }),
  unstable_cancelCallback: vi.fn((callback: Function) => {
    const index = callbacks.findIndex((c) => c.callback === callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }),
  unstable_shouldYield: vi.fn(() => false),
  unstable_requestPaint: vi.fn(),
  unstable_now: vi.fn(() => {
    currentTime += 16; // Simulate 16ms per frame
    return currentTime;
  }),
  unstable_getCurrentPriorityLevel: vi.fn(() => 3),
  unstable_ImmediatePriority: 1,
  unstable_UserBlockingPriority: 2,
  unstable_NormalPriority: 3,
  unstable_LowPriority: 4,
  unstable_IdlePriority: 5,
}));

// Mock requestAnimationFrame for motion animations
let rafCallbacks: Array<FrameRequestCallback> = [];
let rafId = 0;

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;
  currentTime = 0;
});

global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  rafCallbacks.push(callback);
  return ++rafId;
});

global.cancelAnimationFrame = vi.fn((id: number) => {
  // Simple implementation for tests
});

// Helper to flush RAF callbacks
(global as any).flushRAF = () => {
  const callbacks = [...rafCallbacks];
  rafCallbacks = [];
  callbacks.forEach((cb) => cb(performance.now()));
};

// Re-export render from testing-library for convenience
export { render } from "@testing-library/react";
