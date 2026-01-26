import ReactThreeTestRenderer from "@react-three/test-renderer";
import { motion } from "../motion";
import MotionCamera from "../../components/MotionCamera";
import { describe, test, expect } from "vitest";

describe("motion for three", () => {
  test("Renders with basic props", async () => {
    function Component() {
      return (
        <motion.mesh
          scale={[5, 5, 5]}
          position={[1, 2, 3]}
          rotation={[4, 5, 6]}
        />
      );
    }

    const renderer = await ReactThreeTestRenderer.create(<Component />);
    expect(renderer.scene.children).toHaveLength(1);
    expect(renderer.scene.children[0].type).toBe("Mesh");
  });

  test("Renders with animate prop and completes animation frames", async () => {
    function Component() {
      return (
        <motion.mesh
          initial={{ scale: 1, x: 0 }}
          animate={{ scale: 2, x: 10 }}
          transition={{ duration: 0.1 }}
        />
      );
    }

    const renderer = await ReactThreeTestRenderer.create(<Component />);
    await renderer.advanceFrames(10, 16);

    // Verify animation completes without errors
    expect(renderer.scene.children).toHaveLength(1);
    expect(renderer.scene.children[0].type).toBe("Mesh");
  });

  test("Renders with drilled props", async () => {
    function Component() {
      return (
        <motion.mesh
          position-x={1}
          position-y={2}
          position-z={3}
          rotation-x={4}
          rotation-y={5}
          rotation-z={6}
          scale-x={7}
          scale-y={8}
          scale-z={9}
        />
      );
    }

    const renderer = await ReactThreeTestRenderer.create(<Component />);
    expect(renderer.scene.children).toHaveLength(1);
  });

  test("Renders with variants and completes animation frames", async () => {
    function Component() {
      return (
        <motion.mesh
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { scale: 0 },
            visible: { scale: 1 },
          }}
          transition={{ duration: 0.1 }}
        />
      );
    }

    const renderer = await ReactThreeTestRenderer.create(<Component />);
    await renderer.advanceFrames(10, 16);

    expect(renderer.scene.children).toHaveLength(1);
  });

  test("Renders children that inherit initial and animate states from parent", async () => {
    function Component() {
      return (
        <motion.group
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.1 }}
        >
          <motion.mesh
            variants={{
              hidden: { scale: 0 },
              visible: { scale: 1 },
            }}
          />
          <motion.mesh
            variants={{
              hidden: { x: -10 },
              visible: { x: 10 },
            }}
          />
        </motion.group>
      );
    }

    const renderer = await ReactThreeTestRenderer.create(<Component />);
    await renderer.advanceFrames(10, 16);

    expect(renderer.scene.children).toHaveLength(1);
    expect(renderer.scene.children[0].children).toHaveLength(2);
  });

  test("Renders with delayChildren transition on parent", async () => {
    function Component() {
      return (
        <motion.group
          initial="hidden"
          animate="visible"
          transition={{ delayChildren: 0.5 }}
        >
          <motion.mesh
            variants={{
              hidden: { scale: 0 },
              visible: { scale: 1 },
            }}
          />
        </motion.group>
      );
    }

    const renderer = await ReactThreeTestRenderer.create(<Component />);
    await renderer.advanceFrames(20, 16);

    expect(renderer.scene.children).toHaveLength(1);
    expect(renderer.scene.children[0].children).toHaveLength(1);
  });

  test("Renders with staggerChildren transition on parent", async () => {
    function Component() {
      return (
        <motion.group
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.05, duration: 0.1 }}
        >
          <motion.mesh
            variants={{
              hidden: { scale: 0 },
              visible: { scale: 1 },
            }}
          />
          <motion.mesh
            variants={{
              hidden: { scale: 0 },
              visible: { scale: 1 },
            }}
          />
          <motion.mesh
            variants={{
              hidden: { scale: 0 },
              visible: { scale: 1 },
            }}
          />
        </motion.group>
      );
    }

    const renderer = await ReactThreeTestRenderer.create(<Component />);
    await renderer.advanceFrames(20, 16);

    expect(renderer.scene.children).toHaveLength(1);
    expect(renderer.scene.children[0].children).toHaveLength(3);
  });

  test("Renders MotionCamera with animation props", async () => {
    function Component() {
      return (
        <MotionCamera
          type="perspective"
          initial={{ x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0 }}
          animate={{
            x: 10,
            y: 5,
            z: 15,
            rotateX: 0.5,
            rotateY: 1,
          }}
          transition={{ duration: 0.1 }}
        />
      );
    }

    const renderer = await ReactThreeTestRenderer.create(<Component />);
    await renderer.advanceFrames(10, 16);

    expect(renderer.scene.children).toHaveLength(1);
    expect(renderer.scene.children[0].type).toBe("PerspectiveCamera");
  });

  test("Renders with custom prop in function variants", async () => {
    function Component() {
      return (
        <motion.group>
          <motion.mesh
            custom={0}
            initial="hidden"
            variants={{
              hidden: { scale: 0 },
              visible: (i: number) => ({
                scale: 1,
                transition: { delay: i * 0.05, duration: 0.1 },
              }),
            }}
            animate="visible"
          />
          <motion.mesh
            custom={1}
            initial="hidden"
            variants={{
              hidden: { scale: 0 },
              visible: (i: number) => ({
                scale: 1,
                transition: { delay: i * 0.05, duration: 0.1 },
              }),
            }}
            animate="visible"
          />
          <motion.mesh
            custom={2}
            initial="hidden"
            variants={{
              hidden: { scale: 0 },
              visible: (i: number) => ({
                scale: 1,
                transition: { delay: i * 0.05, duration: 0.1 },
              }),
            }}
            animate="visible"
          />
        </motion.group>
      );
    }

    const renderer = await ReactThreeTestRenderer.create(<Component />);
    await renderer.advanceFrames(20, 16);

    expect(renderer.scene.children).toHaveLength(1);
    expect(renderer.scene.children[0].children).toHaveLength(3);
  });

  test("Renders with whileHover prop", async () => {
    function Component() {
      return (
        <motion.mesh
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.5 }}
          transition={{ duration: 0.1 }}
        />
      );
    }

    const renderer = await ReactThreeTestRenderer.create(<Component />);
    const mesh = renderer.scene.children[0];

    expect(mesh).toBeDefined();
    expect(mesh.type).toBe("Mesh");
  });

  test("Renders with whileTap prop", async () => {
    function Component() {
      return (
        <motion.mesh
          initial={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.1 }}
        />
      );
    }

    const renderer = await ReactThreeTestRenderer.create(<Component />);
    const mesh = renderer.scene.children[0];

    expect(mesh).toBeDefined();
    expect(mesh.type).toBe("Mesh");
  });
});
