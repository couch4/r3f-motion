import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { motion } from "../render/motion";
import { PerspectiveCamera, OrthographicCamera } from "three";
import { ThreeMotionProps } from "../types";

interface MotionCameraProps extends ThreeMotionProps {
  fov?: number;
  near?: number;
  far?: number;
  type?: "perspective" | "orthographic";
}

const MotionCamera = (props: MotionCameraProps) => {
  const {
    fov = 75,
    near = 0.1,
    far = 1000,
    type = "perspective",
    ...restProps
  } = props;
  const { size, set } = useThree();

  const camera = useMemo(() => {
    const aspect = size.width / size.height;
    let cam;

    if (type === "perspective") {
      cam = new PerspectiveCamera(fov, aspect, near, far);
    } else {
      const frustumSize = 10;
      cam = new OrthographicCamera(
        (-frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        near,
        far,
      );
    }

    cam.updateProjectionMatrix();
    return cam;
  }, [type, fov, near, far, size.width, size.height]);

  useLayoutEffect(() => {
    set({ camera });
  }, [camera, set]);

  return <motion.primitive object={camera} {...restProps} />;
};

export default MotionCamera;
