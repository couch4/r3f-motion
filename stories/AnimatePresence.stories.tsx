import { useState, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { motion } from "../src/render/motion";
import { AnimatePresence } from "../src/components/AnimatePresence";
import Scene from "./SharedScene";

const meta = {
  title: "Motion3D/AnimatePresence",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "AnimatePresence enables exit animations for motion components when they are removed from the React tree. Wrap your conditionally rendered motion components with AnimatePresence and provide an `exit` prop to define the exit animation.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div
        style={{ width: "100vw", height: "100vh", backgroundColor: "#121212" }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const transition = {
  duration: 0.5,
  ease: "easeInOut" as const,
};

export const ToggleMesh: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Toggle a mesh in and out with scale and opacity exit animations. Click the button to show/hide the cube.",
      },
    },
  },
  render: () => {
    const [show, setShow] = useState(true);

    return (
      <>
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => setShow(!show)}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              borderRadius: 8,
              border: "none",
              background: show ? "#e74c3c" : "#2ecc71",
              color: "white",
              cursor: "pointer",
            }}
          >
            {show ? "Remove" : "Add"}
          </button>
        </div>
        <Scene>
          <AnimatePresence>
            {show && (
              <motion.mesh
                key="cube"
                initial={{ scale: 0, rotateY: 0 }}
                animate={{ scale: 1, rotateY: Math.PI * 0.25 }}
                exit={{ scale: 0, rotateY: Math.PI }}
                transition={transition}
              >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="hotpink" />
              </motion.mesh>
            )}
          </AnimatePresence>
        </Scene>
      </>
    );
  },
};

export const ToggleWithPosition: Story = {
  parameters: {
    docs: {
      description: {
        story: "A mesh that flies in from below and exits upward with a spin.",
      },
    },
  },
  render: () => {
    const [show, setShow] = useState(true);

    return (
      <>
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => setShow(!show)}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              borderRadius: 8,
              border: "none",
              background: show ? "#e74c3c" : "#2ecc71",
              color: "white",
              cursor: "pointer",
            }}
          >
            {show ? "Remove" : "Add"}
          </button>
        </div>
        <Scene>
          <AnimatePresence>
            {show && (
              <motion.mesh
                key="sphere"
                initial={{ y: -3, scale: 0 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 3, scale: 0, rotateZ: Math.PI }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshStandardMaterial color="cyan" />
              </motion.mesh>
            )}
          </AnimatePresence>
        </Scene>
      </>
    );
  },
};

export const SwapMeshes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Swap between two different meshes. The exiting mesh scales down while the entering mesh scales up.",
      },
    },
  },
  render: () => {
    const [shape, setShape] = useState<"box" | "sphere">("box");

    return (
      <>
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => setShape(shape === "box" ? "sphere" : "box")}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              borderRadius: 8,
              border: "none",
              background: "#3498db",
              color: "white",
              cursor: "pointer",
            }}
          >
            Switch to {shape === "box" ? "Sphere" : "Box"}
          </button>
        </div>
        <Scene>
          <AnimatePresence>
            {shape === "box" ? (
              <motion.mesh
                key="box"
                initial={{ scale: 0, rotateX: -Math.PI * 0.5 }}
                animate={{ scale: 1, rotateX: 0 }}
                exit={{ scale: 0, rotateX: Math.PI * 0.5 }}
                transition={transition}
              >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="hotpink" />
              </motion.mesh>
            ) : (
              <motion.mesh
                key="sphere"
                initial={{ scale: 0, rotateX: -Math.PI * 0.5 }}
                animate={{ scale: 1, rotateX: 0 }}
                exit={{ scale: 0, rotateX: Math.PI * 0.5 }}
                transition={transition}
              >
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshStandardMaterial color="cyan" />
              </motion.mesh>
            )}
          </AnimatePresence>
        </Scene>
      </>
    );
  },
};

export const WaitMode: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Uses `mode="wait"` so the exiting mesh fully animates out before the entering mesh animates in. Compare with the SwapMeshes story which uses the default sync mode.',
      },
    },
  },
  render: () => {
    const [shape, setShape] = useState<"box" | "sphere">("box");

    return (
      <>
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => setShape(shape === "box" ? "sphere" : "box")}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              borderRadius: 8,
              border: "none",
              background: "#9b59b6",
              color: "white",
              cursor: "pointer",
            }}
          >
            Switch to {shape === "box" ? "Sphere" : "Box"}
          </button>
        </div>
        <Scene>
          <AnimatePresence mode="wait">
            {shape === "box" ? (
              <motion.mesh
                key="box"
                initial={{ scale: 0, y: -2 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0, y: 2 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="orange" />
              </motion.mesh>
            ) : (
              <motion.mesh
                key="sphere"
                initial={{ scale: 0, y: -2 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0, y: 2 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshStandardMaterial color="limegreen" />
              </motion.mesh>
            )}
          </AnimatePresence>
        </Scene>
      </>
    );
  },
};

export const MultipleItems: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates AnimatePresence with a dynamic list of items. Add and remove meshes with exit animations.",
      },
    },
  },
  render: () => {
    const [items, setItems] = useState([0, 1, 2]);
    const nextId = useRef(3);
    const nextIdRef = nextId;

    const addItem = () => {
      setItems((prev) => [...prev, nextIdRef.current++]);
    };

    const removeItem = (id: number) => {
      setItems((prev) => prev.filter((i) => i !== id));
    };

    return (
      <>
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 1000,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={addItem}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              borderRadius: 8,
              border: "none",
              background: "#2ecc71",
              color: "white",
              cursor: "pointer",
            }}
          >
            Add
          </button>
          {items.map((id) => (
            <button
              key={id}
              onClick={() => removeItem(id)}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                borderRadius: 8,
                border: "none",
                background: "#e74c3c",
                color: "white",
                cursor: "pointer",
              }}
            >
              Remove {id}
            </button>
          ))}
        </div>
        <Scene>
          <AnimatePresence>
            {items.map((id, index) => (
              <motion.mesh
                key={id}
                initial={{ scale: 0, y: -2 }}
                animate={{
                  scale: 0.5,
                  x: (index - (items.length - 1) / 2) * 1.2,
                  y: 0,
                }}
                exit={{ scale: 0, y: 2, rotateZ: Math.PI }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
              >
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial
                  color={`hsl(${(id * 60) % 360}, 80%, 60%)`}
                />
              </motion.mesh>
            ))}
          </AnimatePresence>
        </Scene>
      </>
    );
  },
};

export const MaterialExit: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Combines mesh exit animation with material exit animation. The mesh scales down while the material fades out.",
      },
    },
  },
  render: () => {
    const [show, setShow] = useState(true);

    return (
      <>
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => setShow(!show)}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              borderRadius: 8,
              border: "none",
              background: show ? "#e74c3c" : "#2ecc71",
              color: "white",
              cursor: "pointer",
            }}
          >
            {show ? "Remove" : "Add"}
          </button>
        </div>
        <Scene>
          <AnimatePresence>
            {show && (
              <motion.mesh
                key="fading-cube"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.5 }}
              >
                <boxGeometry args={[1, 1, 1]} />
                <motion.meshStandardMaterial
                  transparent
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  color="gold"
                  metalness={0.8}
                  roughness={0.2}
                />
              </motion.mesh>
            )}
          </AnimatePresence>
        </Scene>
      </>
    );
  },
};
