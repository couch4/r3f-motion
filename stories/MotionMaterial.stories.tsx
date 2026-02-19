import { useState, useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { motion } from "../src/render/motion";
import * as THREE from "three";
import { Html } from "@react-three/drei";
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

export const ShaderMaterialUniforms: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates animating ShaderMaterial uniforms using motion.shaderMaterial. The uTime and uIntensity uniforms are animated with motion's animate prop.",
      },
    },
  },
  render: () => {
    const uniforms = useMemo(
      () => ({
        uTime: { value: 0 },
        uIntensity: { value: 0.5 },
        uColor: { value: new THREE.Color(1, 0.5, 0) },
      }),
      [],
    );

    return (
      <motion.mesh>
        <planeGeometry args={[2, 2]} />
        <motion.shaderMaterial
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform float uIntensity;
            uniform vec3 uColor;
            varying vec2 vUv;
            void main() {
              vec2 center = vec2(0.5, 0.5);
              float dist = distance(vUv, center);
              float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
              float wave = sin(dist * 10.0 - uTime * 3.0) * 0.5 + 0.5;
              float effect = (pulse * 0.3 + wave * 0.7) * uIntensity;
              float gradient = 1.0 - smoothstep(0.0, 0.5, dist);
              vec3 finalColor = uColor * gradient * effect;
              gl_FragColor = vec4(finalColor, 1.0);
            }
          `}
          uniforms={uniforms}
          initial={{ uTime: 0, uIntensity: 0.5 }}
          animate={{ uTime: Math.PI * 2, uIntensity: 1.5 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          side={THREE.DoubleSide}
        />
      </motion.mesh>
    );
  },
};

function VariantShaderPlane({
  variant,
}: {
  variant: "idle" | "active" | "pulse";
}) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0.3 },
      uFrequency: { value: 5 },
    }),
    [],
  );

  return (
    <motion.mesh>
      <planeGeometry args={[2, 2]} />
      <motion.shaderMaterial
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uIntensity;
          uniform float uFrequency;
          varying vec2 vUv;
          void main() {
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);
            float wave = sin(dist * uFrequency - uTime * 3.0) * 0.5 + 0.5;
            float gradient = 1.0 - smoothstep(0.0, 0.6, dist);
            float brightness = wave * gradient * uIntensity;
            vec3 color = mix(vec3(0.0, 0.4, 1.0), vec3(1.0, 0.2, 0.8), wave);
            gl_FragColor = vec4(color * brightness, 1.0);
          }
        `}
        uniforms={uniforms}
        initial="idle"
        animate={variant}
        variants={{
          idle: {
            uTime: 0,
            uIntensity: 0.3,
            uFrequency: 5,
            transition: { ...transition, repeat: false },
          },
          active: {
            uTime: Math.PI * 2,
            uIntensity: 1.5,
            uFrequency: 12,
            transition,
          },
          pulse: {
            uTime: Math.PI * 4,
            uIntensity: 2.5,
            uFrequency: 25,
            transition: { ...transition, repeatType: "forwards" },
          },
        }}
        side={THREE.DoubleSide}
      />
    </motion.mesh>
  );
}

export const ShaderMaterialVariants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates named variants with ShaderMaterial uniforms. Click the buttons to switch between idle, active, and pulse states — each defining different uniform values that animate smoothly.",
      },
    },
  },
  render: () => {
    const [variant, setVariant] = useState<"idle" | "active" | "pulse">("idle");

    return (
      <>
        <Html fullscreen style={{ pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              zIndex: 1000,
              display: "flex",
              gap: 10,
              pointerEvents: "auto",
            }}
          >
            {(["idle", "active", "pulse"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                style={{
                  padding: "10px 20px",
                  fontSize: 15,
                  borderRadius: 8,
                  border: "none",
                  background: variant === v ? "#3498db" : "#444",
                  color: "white",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </Html>
        <VariantShaderPlane variant={variant} />
      </>
    );
  },
};
