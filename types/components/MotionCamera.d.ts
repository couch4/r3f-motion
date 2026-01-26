import { ThreeMotionProps } from "../types";
interface MotionCameraProps extends ThreeMotionProps {
    fov?: number;
    near?: number;
    far?: number;
    type?: "perspective" | "orthographic";
}
declare const MotionCamera: (props: MotionCameraProps) => import("react/jsx-runtime").JSX.Element;
export default MotionCamera;
