import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Scene from "./SharedScene";
import { motion } from "../src/render/motion";

// Wrapper component for documentation purposes
const MotionMeshWithCallbacks = motion.mesh;

const meta = {
  title: "Motion3D/MotionEvents",
  component: MotionMeshWithCallbacks,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Demonstrates animation lifecycle callbacks: onAnimationStart, onAnimationUpdate, and onAnimationComplete. These callbacks receive the animated values and optional variant name.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{ width: "100vw", height: "100vh", backgroundColor: "#121212" }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onAnimationStart: {
      description:
        "Callback fired when animation starts. Receives (values: Record<string, unknown>, variant?: string)",
      control: false,
    },
    onAnimationUpdate: {
      description:
        "Callback fired on each animation frame. Receives (values: Record<string, unknown>, variant?: string)",
      control: false,
    },
    onAnimationComplete: {
      description:
        "Callback fired when animation completes. Receives (values: Record<string, unknown>, variant?: string)",
      control: false,
    },
    initial: {
      description: "Initial animation values",
      control: "object",
    },
    animate: {
      description: "Target animation values",
      control: "object",
    },
    variants: {
      description: "Named animation variants",
      control: "object",
    },
    transition: {
      description: "Animation transition configuration",
      control: "object",
    },
  },
} satisfies Meta<typeof MotionMeshWithCallbacks>;

export default meta;
type Story = StoryObj<typeof meta>;

const transition = {
  type: "spring",
  damping: 50,
  stiffness: 200,
};

export const OnAnimationStart: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the onAnimationStart callback, which fires once when the animation begins. The callback receives the variant name if using variants.",
      },
    },
  },
  render: () => {
    const [status, setStatus] = useState<string | null>("false");

    const handleStart = (variant?: string) => {
      setStatus(`Variant: ${variant || "none"}`);
    };

    return (
      <>
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            color: "white",
            fontFamily: "monospace",
            fontSize: 16,
            zIndex: 1000,
            background: "rgba(0,0,0,0.7)",
            padding: "10px 20px",
            borderRadius: 8,
          }}
          dangerouslySetInnerHTML={{
            __html: ` Animation Started: <strong>${status}</strong>`,
          }}
        ></div>
        <Scene>
          <motion.mesh
            initial="inactive"
            animate="active"
            variants={{
              inactive: {
                scale: 0,
                rotateY: 0,
              },
              active: {
                scale: 2,
                rotateY: Math.PI * 0.5,
                rotateX: Math.PI * 0.5,
              },
            }}
            transition={transition}
            onAnimationStart={handleStart}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="fuchsia" />
          </motion.mesh>
        </Scene>
      </>
    );
  },
};

export const OnAnimationUpdate: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the onAnimationUpdate callback, which fires on every animation frame. The callback receives the current animated values and optional variant name.",
      },
    },
  },
  render: () => {
    const [status, setStatus] = useState<string | null>("false");

    const handleUpdate = (value?: string, variant?: string) => {
      setStatus(
        ` Variant: ${variant || "none"} <br/>Values: ${JSON.stringify(value) || "none"}`,
      );
    };

    return (
      <>
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            color: "white",
            fontFamily: "monospace",
            fontSize: 16,
            zIndex: 1000,
            background: "rgba(0,0,0,0.7)",
            padding: "10px 20px",
            borderRadius: 8,
          }}
          dangerouslySetInnerHTML={{
            __html: `Animation updating: <strong>${status}</strong>`,
          }}
        ></div>
        <Scene>
          <motion.mesh
            initial="inactive"
            animate="active"
            variants={{
              inactive: {
                scale: 0,
                rotateY: 0,
              },
              active: {
                scale: 2,
                rotateY: Math.PI * 0.5,
                rotateX: Math.PI * 0.5,
              },
            }}
            transition={transition}
            onAnimationUpdate={handleUpdate}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="fuchsia" />
          </motion.mesh>
        </Scene>
      </>
    );
  },
};

export const OnAnimationComplete: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the onAnimationComplete callback, which fires once when the animation finishes. The callback receives the final values and optional variant name.",
      },
    },
  },
  render: () => {
    const [status, setStatus] = useState<string | null>("false");

    const handleComplete = (variant?: string) => {
      setStatus(`Variant: ${variant || "none"}`);
    };

    return (
      <>
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            color: "white",
            fontFamily: "monospace",
            fontSize: 16,
            zIndex: 1000,
            background: "rgba(0,0,0,0.7)",
            padding: "10px 20px",
            borderRadius: 8,
          }}
          dangerouslySetInnerHTML={{
            __html: ` Animation Complete: <strong>${status}</strong>`,
          }}
        ></div>
        <Scene>
          <motion.mesh
            initial={{ scale: 0, rotateY: 0 }}
            animate="active"
            variants={{
              inactive: {
                scale: 0,
                rotateY: 0,
              },
              active: {
                scale: 2,
                rotateY: Math.PI * 0.5,
                rotateX: Math.PI * 0.5,
              },
            }}
            transition={transition}
            onAnimationComplete={handleComplete}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="fuchsia" />
          </motion.mesh>
        </Scene>
      </>
    );
  },
};
