import type { Meta, StoryObj } from "@storybook/react-vite";
import MotionCamera from "../src/components/MotionCamera";
import Scene from "./SharedScene";

const meta = {
  title: "Motion3D/MotionCamera",
  component: MotionCamera,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div
        style={{ width: "100vw", height: "100vh", backgroundColor: "#121212" }}
      >
        <Scene controls={false}>
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="hotpink" />
          </mesh>
          <Story />
        </Scene>
      </div>
    ),
  ],
  argTypes: {
    type: {
      control: "select",
      options: ["perspective", "orthographic"],
      description: "Camera type",
    },
    initial: {
      control: "object",
      description: "Initial animation values",
    },
    animate: {
      control: "object",
      description: "Target animation values",
    },
    transition: {
      control: "object",
      description: "Animation transition configuration",
    },
  },
} satisfies Meta<typeof MotionCamera>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AnimatingCamera: Story = {
  args: {
    initial: { x: 0, z: 5, rotateX: 0 },

    animate: {
      x: 2,
      z: 10,
      rotateY: Math.PI * 0.01,
      rotateZ: Math.PI * 0.2,
    },

    transition: { duration: 2, repeat: Infinity, repeatType: "reverse" },
    type: "perspective"
  },
};

export const AnimatingOrthographicCamera: Story = {
  args: {
    type: "orthographic",
    initial: { x: 0, z: 5, rotateX: 0 },
    animate: {
      x: 2,
      z: 10,
      rotateY: Math.PI * 0.01,
      rotateZ: Math.PI * 0.2,
    },
    transition: { duration: 2, repeat: Infinity, repeatType: "reverse" },
  },
};
