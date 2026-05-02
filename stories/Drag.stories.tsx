import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Environment, Grid, ContactShadows, Stats } from "@react-three/drei";
import { motion } from "../src/render/motion";
import type { DragInfo } from "../src/types";

// Drag stories disable OrbitControls to prevent camera/drag conflicts
const DragScene = ({ children }: { children: React.ReactNode }) => (
  <Canvas shadows flat linear>
    <Environment preset="apartment" />
    {children}
    <Grid
      position={[0, -0.5, 0]}
      args={[10, 10]}
      cellSize={0.6}
      cellThickness={1}
      cellColor="#6f6f6f"
      sectionSize={3.3}
      sectionThickness={1.5}
      sectionColor="#1a8e96"
      fadeDistance={25}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid
    />
    <ContactShadows
      position={[0, -0.5, 0]}
      opacity={1}
      scale={10}
      blur={2}
      far={10}
      resolution={256}
      color="#000000"
    />
    <Stats />
  </Canvas>
);

const Overlay = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      position: "absolute",
      bottom: 20,
      left: 20,
      color: "white",
      fontFamily: "monospace",
      fontSize: 14,
      zIndex: 1000,
      background: "rgba(0,0,0,0.7)",
      padding: "10px 20px",
      borderRadius: 8,
      pointerEvents: "none",
    }}
  >
    {children}
  </div>
);

const meta = {
  title: "Motion3D/Drag",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", backgroundColor: "#121212" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Free Drag ────────────────────────────────────────────────────────────────

export const FreeDrag: Story = {
  name: "Free Drag (XY)",
  parameters: {
    docs: {
      description: {
        story:
          "drag={true} lets the mesh move freely on the XY plane relative to the camera. OrbitControls is disabled to avoid conflicts.",
      },
    },
  },
  render: () => (
    <DragScene>
      <motion.mesh drag position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </motion.mesh>
    </DragScene>
  ),
};

// ─── Axis-Locked Drag ─────────────────────────────────────────────────────────

export const DragAxisX: Story = {
  name: "Drag — X Axis Only",
  render: () => (
    <DragScene>
      <motion.mesh drag="x" position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="cyan" />
      </motion.mesh>
    </DragScene>
  ),
};

export const DragAxisY: Story = {
  name: "Drag — Y Axis Only",
  render: () => (
    <DragScene>
      <motion.mesh drag="y" position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="lime" />
      </motion.mesh>
    </DragScene>
  ),
};

export const DragAxisZ: Story = {
  name: "Drag — Z Axis (depth)",
  parameters: {
    docs: {
      description: {
        story:
          "drag='z' maps vertical mouse movement to Z-axis (depth) movement. Drag up to push the mesh away, drag down to pull it closer.",
      },
    },
  },
  render: () => (
    <DragScene>
      <OrbitControls enableRotate={false} enablePan={false} />
      <motion.mesh drag="z" position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </motion.mesh>
    </DragScene>
  ),
};

// ─── Drag Constraints ─────────────────────────────────────────────────────────

export const DragWithConstraints: Story = {
  name: "Drag with Constraints",
  parameters: {
    docs: {
      description: {
        story:
          "dragConstraints defines world-space bounding box. dragElastic controls how far the mesh can be pulled past the edge (0 = rigid, 1 = no resistance).",
      },
    },
  },
  render: () => (
    <DragScene>
      <motion.mesh
        drag
        dragConstraints={{ left: -2, right: 2, top: 2, bottom: -2 }}
        dragElastic={0.2}
        position={[0, 0, 0]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </motion.mesh>
      {/* Boundary wireframe showing constraint limits */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[4, 4]} />
        <meshBasicMaterial color="#ffffff" opacity={0.05} transparent wireframe />
      </mesh>
    </DragScene>
  ),
};


// ─── dragSnapToOrigin ─────────────────────────────────────────────────────────

export const DragSnapToOrigin: Story = {
  name: "dragSnapToOrigin",
  parameters: {
    docs: {
      description: {
        story:
          "dragSnapToOrigin snaps the mesh back to its starting position on release using a spring animation.",
      },
    },
  },
  render: () => (
    <DragScene>
      <motion.mesh
        drag
        dragSnapToOrigin
        dragTransition={{ type: "spring", damping: 40, stiffness: 300 }}
        position={[0, 0, 0]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="gold" />
      </motion.mesh>
    </DragScene>
  ),
};

// ─── No Momentum ──────────────────────────────────────────────────────────────

export const DragNoMomentum: Story = {
  name: "Drag — No Momentum",
  parameters: {
    docs: {
      description: {
        story: "dragMomentum={false} stops the mesh exactly where you release it.",
      },
    },
  },
  render: () => (
    <DragScene>
      <motion.mesh drag dragMomentum={false} position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="tomato" />
      </motion.mesh>
    </DragScene>
  ),
};

// ─── Drag Callbacks ───────────────────────────────────────────────────────────

export const DragCallbacks: Story = {
  name: "Drag Callbacks",
  parameters: {
    docs: {
      description: {
        story:
          "onDragStart, onDrag, and onDragEnd receive a PointerEvent plus a DragInfo object with point, offset, delta, and velocity in world-space units.",
      },
    },
  },
  render: () => {
    const [status, setStatus] = useState("idle");
    const [offset, setOffset] = useState({ x: 0, y: 0, z: 0 });
    const [velocity, setVelocity] = useState({ x: 0, y: 0, z: 0 });

    return (
      <>
        <Overlay>
          <div>Status: <strong>{status}</strong></div>
          <div>
            Offset: x={offset.x.toFixed(2)} y={offset.y.toFixed(2)} z={offset.z.toFixed(2)}
          </div>
          <div>
            Velocity: x={velocity.x.toFixed(1)} y={velocity.y.toFixed(1)}
          </div>
        </Overlay>
        <DragScene>
          <motion.mesh
            drag
            position={[0, 0, 0]}
            onDragStart={() => setStatus("dragging")}
            onDrag={(_e: PointerEvent, info: DragInfo) => {
              setOffset(info.offset);
              setVelocity(info.velocity);
            }}
            onDragEnd={(_e: PointerEvent, info: DragInfo) => {
              setStatus("released");
              setVelocity(info.velocity);
            }}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="deepskyblue" />
          </motion.mesh>
        </DragScene>
      </>
    );
  },
};

// ─── Kitchen Sink ─────────────────────────────────────────────────────────────

export const DragGroup: Story = {
  name: "Draggable Group",
  parameters: {
    docs: {
      description: {
        story:
          "A group of individually draggable meshes, each with whileDrag and snapToOrigin.",
      },
    },
  },
  render: () => (
    <DragScene>
      {(
        [
          { color: "hotpink", pos: [-2, 0, 0] },
          { color: "cyan", pos: [0, 0, 0] },
          { color: "lime", pos: [2, 0, 0] },
        ] as { color: string; pos: [number, number, number] }[]
      ).map(({ color, pos }) => (
        <motion.mesh
          key={color}
          drag
          dragSnapToOrigin
          dragTransition={{ type: "spring", damping: 30, stiffness: 300 }}
          whileDrag={{ scale: 1.3 }}
          transition={{ type: "spring", damping: 20, stiffness: 400 }}
          position={pos}
        >
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshStandardMaterial color={color} />
        </motion.mesh>
      ))}
    </DragScene>
  ),
};
