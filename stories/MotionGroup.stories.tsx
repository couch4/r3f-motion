import type { Meta, StoryObj } from "@storybook/react-vite";
import { Html } from "@react-three/drei";
import { motion } from "../src/render/motion";
import { motion as htmlMotion } from "motion/react";
import Scene from "./SharedScene";

// Wrapper component for documentation purposes
const MotionGroup = motion.group;

const meta = {
  title: "Motion3D/MotionGroup",
  component: MotionGroup,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Demonstrates motion.group for orchestrating animations across multiple child objects. Groups support variants, staggering, delayChildren, and custom props for coordinated animations.",
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
  argTypes: {
    initial: {
      description: "Initial animation values or variant name",
      control: "object",
    },
    animate: {
      description: "Target animation values or variant name",
      control: "object",
    },
    variants: {
      description: "Named animation variants that children can inherit",
      control: "object",
    },
    transition: {
      description:
        "Animation transition configuration. Supports delayChildren and staggerChildren for orchestration",
      control: "object",
    },
    custom: {
      description: "Custom data passed to variant functions",
      control: false,
    },
  },
} satisfies Meta<typeof MotionGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RotatingGroup: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A simple rotating group containing multiple meshes. All children rotate together as the group animates.",
      },
    },
  },
  render: (_, context) => (
    <Scene controls={context?.globals?.orbit || false}>
      <motion.group
        initial={{ rotateY: 0 }}
        animate={{ rotateY: Math.PI * 2 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <mesh position={[-1.5, 0, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="green" />
        </mesh>
        <mesh position={[1.5, 0, 0]}>
          <coneGeometry args={[0.5, 1, 32]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </motion.group>
    </Scene>
  ),
};

export const StaggeredGroup: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates staggerChildren and delayChildren in the group transition. Each child animates with a delay, creating a staggered effect.",
      },
    },
  },
  render: (_, context) => (
    <Scene controls={context?.globals?.orbit || false}>
      <motion.group
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 1,
          ease: "backOut",
          delayChildren: 0.1,
          staggerChildren: 0.1,
        }}
      >
        <motion.mesh
          position={[-1.5, 0, 0]}
          initial={{ y: -2 }}
          animate={{ y: 0 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 200,
          }}
        >
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="hotpink" />
        </motion.mesh>
        <motion.mesh
          position={[0, 0, 0]}
          initial={{ y: -2 }}
          animate={{ y: 0 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 200,
          }}
        >
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="cyan" />
        </motion.mesh>
        <motion.mesh
          position={[1.5, 0, 0]}
          initial={{ y: -2 }}
          animate={{ y: 0 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 200,
          }}
        >
          <coneGeometry args={[0.5, 1, 32]} />
          <meshStandardMaterial color="yellow" />
        </motion.mesh>
      </motion.group>
    </Scene>
  ),
};

export const OrbitingGroup: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A group that rotates while its children animate in with staggered delays. Demonstrates combining group and child animations.",
      },
    },
  },
  render: (_, context) => (
    <Scene controls={context?.globals?.orbit || false}>
      <motion.group
        initial={{ rotateY: 0, rotateX: 0 }}
        animate={{ rotateY: Math.PI * 2, rotateX: Math.PI * 0.1 }}
        transition={{
          rotateY: { duration: 8, repeat: Infinity, ease: "linear" },
          rotateX: { type: "spring", damping: 50, stiffness: 50, delay: 0.2 },
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          const radius = 2;
          return (
            <motion.mesh
              key={i}
              position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: i * 0.1,
                duration: 0.5,
                type: "spring",
              }}
            >
              <sphereGeometry args={[0.3, 32, 32]} />
              <meshStandardMaterial color={`hsl(${i * 72}, 70%, 60%)`} />
            </motion.mesh>
          );
        })}
      </motion.group>
    </Scene>
  ),
};

export const WaveGroup: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Creates a wave effect by animating multiple meshes with staggered delays. Each mesh bounces up and down in sequence.",
      },
    },
  },
  render: (_, context) => (
    <Scene controls={context?.globals?.orbit || false}>
      <motion.group>
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.mesh
            key={i}
            position={[i - 4.5, 0, 0]}
            initial={{ y: 0 }}
            animate={{ y: [0, 1, 0] }}
            transition={{
              delay: i * 0.1,
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color={`hsl(${i * 36}, 70%, 60%)`} />
          </motion.mesh>
        ))}
      </motion.group>
    </Scene>
  ),
};

const transition = {
  type: "spring",
  damping: 50,
  stiffness: 200,
};

export const InheritedVariants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates variant inheritance. The group defines variants that children inherit and extend with their own variant definitions.",
      },
    },
  },
  render: (_, context) => (
    <Scene controls={context?.globals?.orbit || false}>
      <motion.group
        initial="inactive"
        animate="active"
        variants={{
          inactive: { scale: 0 },
          active: { scale: 1 },
        }}
        transition={transition}
      >
        <motion.mesh
          position={[-1.5, 0, 0]}
          variants={{
            inactive: { scale: 0.8, y: -2 },
            active: { scale: 1, rotateY: Math.PI, y: 0 },
          }}
          transition={{ ...transition, delay: 0.2 }}
        >
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="hotpink" />
        </motion.mesh>
        <motion.mesh
          position={[0, 0, 0]}
          variants={{
            inactive: { scale: 0.8, y: -2 },
            active: { scale: 1, rotateY: Math.PI, y: 0 },
          }}
          transition={{ ...transition, delay: 0.4 }}
        >
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="cyan" />
        </motion.mesh>
        <motion.mesh
          position={[1.5, 0, 0]}
          variants={{
            inactive: { scale: 0.8, y: -2 },
            active: { scale: 1, rotateY: Math.PI, y: 0 },
          }}
          transition={{ ...transition, delay: 0.6 }}
        >
          <coneGeometry args={[0.5, 1, 32]} />
          <meshStandardMaterial color="yellow" />
        </motion.mesh>
      </motion.group>
    </Scene>
  ),
};

const externalVariants = {
  inactive: { scale: 0.8 },
  active: (custom: number) => ({
    scale: 1,
    rotateY: Math.PI,
    transition: { ...transition, delay: 0.2 * custom },
  }),
};

export const CustomProp: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the custom prop with function variants. Each child receives a custom value (its index) that the variant function uses to calculate unique delays.",
      },
    },
  },
  render: (_, context) => (
    <Scene controls={context?.globals?.orbit || false}>
      <motion.group initial="inactive" animate="active">
        {["hotpink", "cyan", "orange", "blue"].map(
          (color: string, index: number) => (
            <motion.mesh
              key={color}
              custom={index}
              position={[-1.5 + index * 1, 0, 0]}
              variants={externalVariants}
            >
              <boxGeometry args={[0.8, 0.8, 0.8]} />
              <Html
                position={[0, 0, -0.5]}
                transform
                distanceFactor={1}
                occlude
              >
                <htmlMotion.div
                  style={{
                    color: "black",
                    fontWeight: "bold",
                    fontSize: "200px",
                    opacity: 0.5,
                  }}
                  initial={{
                    y: -30,
                    scaleX: -1,
                  }}
                  animate={{
                    y: 0,
                  }}
                  transition={{
                    type: "spring",
                    damping: 10,
                    stiffness: 200,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  {index}
                </htmlMotion.div>
              </Html>
              <meshStandardMaterial color={color} />
            </motion.mesh>
          ),
        )}
      </motion.group>
    </Scene>
  ),
};
