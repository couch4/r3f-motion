import type { Meta, StoryObj } from "@storybook/react-vite";
import { motion } from "../src/render/motion";
import Scene from "./SharedScene";
import { ThreeMotionProps } from "../src/types";

const MotionMesh = (props: ThreeMotionProps & { color?: string }) => (
  <motion.mesh {...props}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color={props.color || "hotpink"} />
  </motion.mesh>
);

const meta = {
  title: "Motion3D/MotionCube",
  component: MotionMesh,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story, context) => (
      <div
        style={{ width: "100vw", height: "100vh", backgroundColor: "#121212" }}
      >
        <Scene controls={context?.globals?.orbit || false}>
          <Story />
        </Scene>
      </div>
    ),
  ],
  argTypes: {
    initial: {
      control: "object",
      description: "Initial animation values",
    },
    animate: {
      control: "object",
      description: "Target animation values",
    },
    whileHover: {
      control: "object",
      description: "Animation values while hovering",
    },
    whileTap: {
      control: "object",
      description: "Animation values while tapping/clicking",
    },
    transition: {
      control: "object",
      description: "Animation transition configuration",
    },
    color: {
      control: "color",
      description: "Mesh color",
    },
  },
} satisfies Meta<typeof MotionMesh>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AnimatingCube: Story = {
  args: {
    initial: { scale: 0, rotateY: 0 },
    animate: { scale: 1, rotateY: Math.PI * 2 },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    color: "hotpink",
  },
};

export const AnimatingCubeSpring: Story = {
  args: {
    initial: { scale: 0, rotateY: 0 },
    animate: { scale: 1, rotateY: Math.PI * 0.5 },
    transition: {
      repeat: Infinity,
      type: "spring",
      damping: 50,
      stiffness: 200,
    },
    color: "hotpink",
  },
};

export const BouncingCube: Story = {
  args: {
    initial: { y: 0, rotateY: 0 },
    animate: { y: 1, rotateY: Math.PI },
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    },
    color: "cyan",
  },
};

export const HoverCube: Story = {
  args: {
    initial: { scale: 1 },
    whileHover: { scale: 1.5 },
    whileTap: { rotateX: Math.PI * 0.5, rotateY: Math.PI * 0.25 },
    transition: { type: "spring", damping: 50, stiffness: 500 },
    color: "orange",
  },
};

export const ColorChangingCube: Story = {
  render: () => (
    <motion.mesh>
      <boxGeometry args={[1, 1, 1]} />
      <motion.meshStandardMaterial
        initial={{ color: "#ff0000" }}
        animate={{ color: "#0000ff" }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      />
    </motion.mesh>
  ),
};

export const RestDelta: Story = {
  render: () => (
    <motion.mesh
      initial={{ z: -100 }}
      animate={{ z: 2 }}
      transition={{
        type: "spring",
        damping: 50,
        stiffness: 100,
        restDelta: 0.001,
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <motion.meshStandardMaterial color="hotpink" />
    </motion.mesh>
  ),
};
