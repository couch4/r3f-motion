import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Grid, OrbitControls, Stats, ContactShadows } from "@react-three/drei";

interface SceneProps {
  children: React.ReactNode;
  controls?: boolean;
}

const Scene = ({ children, controls = true }: SceneProps) => (
  <Canvas shadows flat linear>
    <Environment preset="apartment" />
    {children}
    {controls && <OrbitControls />}
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

export default Scene;
