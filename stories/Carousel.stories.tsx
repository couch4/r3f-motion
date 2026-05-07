import type { Meta, StoryObj } from "@storybook/react-vite";
import { Environment, Html } from "@react-three/drei";
import Carousel from "../src/components/Carousel";
import Scene from "./SharedScene";

const meta = {
  title: "Motion3D/Carousel",
  component: Carousel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Free-drag 3D carousel built on motion.group with drag="x". On release the carousel projects the release point with offset + velocity*0.2s, snaps to the nearest slide, and tweens there with a spring. Items wrap continuously against the live group position so any drag distance keeps copies in view.',
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story, context) => (
      <div
        style={{ width: "100vw", height: "100vh", backgroundColor: "#121212" }}
      >
        {/* @ts-ignore */}
        <Scene controls={context?.globals?.orbit || false}>
          <Environment preset="warehouse" />
          <Story />
        </Scene>
      </div>
    ),
  ],
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const colorItems = [{ color: "hotpink" }, { color: "cyan" }, { color: "gold" }];

export const CarouselLoop: Story = {
  args: {
    itemWidth: 1.5,
    gap: 0.5,
    defaultValue: 0,
    // @ts-ignore
    freeCamera: false,
    renderThreshold: undefined,
    disable: false,
  },
  argTypes: {
    itemWidth: { control: { type: "number", step: 0.1 } },
    gap: { control: { type: "number", step: 0.1 } },
    defaultValue: { control: "number" },
    disable: { control: "boolean" },
  },
  render: (args) => (
    <Carousel
      {...args}
      items={colorItems.map((item, i: number) => (
        <group
          key={`carouselItem-${i}`}
          position-y={0.5}
          onClick={() => alert(`clicked on ${i}`)}
        >
          <mesh>
            <boxGeometry
              args={[args.itemWidth ?? 1.5, args.itemWidth ?? 1.5, 0.3]}
            />
            <meshStandardMaterial color={(item as { color: string }).color} />
          </mesh>
          <Html
            position={[0, 0, (args?.itemWidth ?? 1.5) * 0.105]}
            transform
            distanceFactor={1}
            pointerEvents="none"
          >
            <div
              style={{
                color: "white",
                fontFamily: "Arial, sans-serif",
                fontWeight: "bold",
                fontSize: ` ${(args?.itemWidth ?? 1.5) * 200}px`,
                userSelect: "none",
              }}
            >
              {i}
            </div>
          </Html>
        </group>
      ))}
    />
  ),
};
