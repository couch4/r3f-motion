import type { Meta, StoryObj } from "@storybook/react-vite";
import { motion } from "../src/render/motion";
import Scene from "./SharedScene";

const MotionMaterial = motion.meshStandardMaterial;

const meta = {
  title: "Motion3D/MotionMaterial",
  component: MotionMaterial,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Demonstrates animating material properties using motion.[material] components. Supports opacity, metalness, roughness, emissiveIntensity, color, emissive, and any other numeric material property.",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div
        style={{ width: "100vw", height: "100vh", backgroundColor: "#121212" }}
      >
        <Scene>
          <Story />
        </Scene>
      </div>
    ),
  ],
} satisfies Meta<typeof MotionMaterial>;

export default meta;
type Story = StoryObj<typeof meta>;

const transition = {
  duration: 2,
  repeat: Infinity,
  repeatType: "reverse" as const,
  ease: "easeInOut" as const,
};

export const Opacity: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Animates the opacity of a meshStandardMaterial from 0.1 to 1. The material must have `transparent` set to `true` for opacity to take effect.",
      },
    },
  },
  render: () => (
    <motion.mesh>
      <boxGeometry args={[1, 1, 1]} />
      <motion.meshStandardMaterial
        transparent
        initial={{ opacity: 0.1 }}
        animate={{ opacity: 1 }}
        transition={transition}
        color="hotpink"
      />
    </motion.mesh>
  ),
};

export const Roughness: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Animates roughness from 0 (mirror-like) to 1 (fully rough). Best observed with an environment map or lighting.",
      },
    },
  },
  render: () => (
    <motion.mesh>
      <sphereGeometry args={[0.8, 64, 64]} />
      <motion.meshStandardMaterial
        initial={{ roughness: 0 }}
        animate={{ roughness: 1 }}
        transition={transition}
        color="gold"
        metalness={1}
      />
    </motion.mesh>
  ),
};

export const Metalness: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Animates metalness from 0 (dielectric) to 1 (fully metallic). Combined with low roughness for a clear visual effect.",
      },
    },
  },
  render: () => (
    <motion.mesh>
      <sphereGeometry args={[0.8, 64, 64]} />
      <motion.meshStandardMaterial
        initial={{ metalness: 0 }}
        animate={{ metalness: 1 }}
        transition={transition}
        color="silver"
        roughness={0.2}
      />
    </motion.mesh>
  ),
};

export const EmissiveIntensity: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Animates emissiveIntensity to create a glowing/pulsing effect. The emissive color determines the glow color.",
      },
    },
  },
  render: () => (
    <motion.mesh>
      <sphereGeometry args={[0.8, 64, 64]} />
      <motion.meshStandardMaterial
        initial={{ emissiveIntensity: 0 }}
        animate={{ emissiveIntensity: 3 }}
        transition={transition}
        color="black"
        emissive="cyan"
      />
    </motion.mesh>
  ),
};

export const ColorAnimation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Animates the base color of the material between two colors using RGB channel interpolation.",
      },
    },
  },
  render: () => (
    <motion.mesh>
      <boxGeometry args={[1, 1, 1]} />
      <motion.meshStandardMaterial
        initial={{ color: "#ff0000" }}
        animate={{ color: "#0000ff" }}
        transition={transition}
      />
    </motion.mesh>
  ),
};

export const EmissiveColor: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Animates the emissive color of the material, creating a color-shifting glow effect.",
      },
    },
  },
  render: () => (
    <motion.mesh>
      <sphereGeometry args={[0.8, 64, 64]} />
      <motion.meshStandardMaterial
        initial={{ emissive: "#ff0000" }}
        animate={{ emissive: "#00ff00" }}
        transition={transition}
        color="black"
        emissiveIntensity={2}
      />
    </motion.mesh>
  ),
};

export const CombinedProperties: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Animates multiple material properties simultaneously: opacity, roughness, metalness, and emissiveIntensity.",
      },
    },
  },
  render: () => (
    <motion.mesh>
      <sphereGeometry args={[0.8, 64, 64]} />
      <motion.meshStandardMaterial
        transparent
        initial={{
          opacity: 0.3,
          roughness: 1,
          metalness: 0,
          emissiveIntensity: 0,
        }}
        animate={{
          opacity: 1,
          roughness: 0,
          metalness: 1,
          emissiveIntensity: 2,
        }}
        transition={transition}
        color="silver"
        emissive="purple"
      />
    </motion.mesh>
  ),
};

export const MaterialWithMeshAnimation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Combines mesh transform animations with material property animations. The mesh rotates while the material fades and changes roughness.",
      },
    },
  },
  render: () => (
    <motion.mesh
      initial={{ rotateY: 0 }}
      animate={{ rotateY: Math.PI * 2 }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <motion.meshStandardMaterial
        transparent
        initial={{ opacity: 0.2, roughness: 1, metalness: 0 }}
        animate={{ opacity: 1, roughness: 0, metalness: 1 }}
        transition={transition}
        color="hotpink"
      />
    </motion.mesh>
  ),
};

export const SpringTransition: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Uses a spring transition for material property animations, demonstrating that spring physics work with material values.",
      },
    },
  },
  render: () => (
    <motion.mesh>
      <sphereGeometry args={[0.8, 64, 64]} />
      <motion.meshStandardMaterial
        initial={{ roughness: 1, metalness: 0 }}
        animate={{ roughness: 0, metalness: 1 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        color="gold"
      />
    </motion.mesh>
  ),
};

export const HoverMaterial: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates whileHover on a material component. Hover over the sphere to see the material become shiny and metallic.",
      },
    },
  },
  render: () => (
    <motion.mesh>
      <sphereGeometry args={[0.8, 64, 64]} />
      <motion.meshStandardMaterial
        initial={{ roughness: 1, metalness: 0, emissiveIntensity: 0 }}
        whileHover={{ roughness: 0, metalness: 1, emissiveIntensity: 1.5 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        color="coral"
        emissive="coral"
      />
    </motion.mesh>
  ),
};

export const VariantsMaterial: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Uses named variants for material animations, cycling between different material states.",
      },
    },
  },
  render: () => (
    <motion.mesh
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <sphereGeometry args={[0.8, 64, 64]} />
      <motion.meshStandardMaterial
        initial="matte"
        animate="glossy"
        variants={{
          matte: {
            roughness: 1,
            metalness: 0,
            emissiveIntensity: 0,
          },
          glossy: {
            roughness: 0,
            metalness: 1,
            emissiveIntensity: 1,
          },
        }}
        transition={transition}
        color="teal"
        emissive="teal"
      />
    </motion.mesh>
  ),
};
