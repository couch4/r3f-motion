import type { Meta, StoryObj } from "@storybook/react-vite";
import { motion } from "../src/render/motion";
import Scene from "./SharedScene";

const meta = {
  title: "Motion3D/MotionCube",
  parameters: {
    layout: "fullscreen",
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
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AnimatingCube: Story = {
  render: () => (
    <Scene>
      <motion.mesh
        initial={{ scale: 0, rotateY: 0 }}
        animate={{ scale: 1, rotateY: Math.PI * 2 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </motion.mesh>
    </Scene>
  ),
};

export const AnimatingCubeSpring: Story = {
  render: () => (
    <Scene>
      <motion.mesh
        initial={{ scale: 0, rotateY: 0 }}
        animate={{ scale: 1, rotateY: Math.PI * 0.5 }}
        transition={{
          repeat: Infinity,
          type: "spring",
          damping: 50,
          stiffness: 200,
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </motion.mesh>
    </Scene>
  ),
};

export const BouncingCube: Story = {
  render: () => (
    <Scene>
      <motion.mesh
        initial={{ y: 0, rotateY: 0 }}
        animate={{ y: 1, rotateY: Math.PI }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="cyan" />
      </motion.mesh>
    </Scene>
  ),
};

export const HoverCube: Story = {
  render: () => (
    <Scene>
      <motion.mesh
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.5 }}
        whileTap={{ rotateX: Math.PI * 0.5, rotateY: Math.PI * 0.25 }}
        transition={{ type: "spring", damping: 50, stiffness: 500 }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </motion.mesh>
    </Scene>
  ),
};

export const ColorChangingCube: Story = {
  render: () => (
    <Scene>
      <motion.mesh>
        <boxGeometry args={[1, 1, 1]} />
        <motion.meshStandardMaterial
          initial={{ color: "#ff0000" }}
          animate={{ color: "#0000ff" }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        />
      </motion.mesh>
    </Scene>
  ),
};
