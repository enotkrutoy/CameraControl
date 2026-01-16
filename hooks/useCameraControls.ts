
import { useState, useCallback, useMemo } from 'react';
import { CameraControlState } from '../types';
import { DEFAULT_CAMERA_STATE } from '../constants';

export const useCameraControls = () => {
  const [state, setState] = useState<CameraControlState>(DEFAULT_CAMERA_STATE);

  const updateState = useCallback((updates: Partial<CameraControlState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_CAMERA_STATE);
  }, []);

  const buildCameraPrompt = useCallback((s: CameraControlState): string => {
    if (s.rotate === 0 && s.forward === 0 && s.tilt === 0 && !s.wideAngle) {
      return "no camera movement";
    }

    const segments: string[] = [];

    // Rotation
    if (s.rotate !== 0) {
      const direction = s.rotate > 0 ? "right" : "left";
      const zhDir = s.rotate > 0 ? "右" : "左";
      segments.push(`将镜头向${zhDir}旋转${Math.abs(s.rotate)}度 Rotate the camera ${Math.abs(s.rotate)} degrees to the ${direction}.`);
    }

    // Forward / Zoom
    if (s.forward > 5) {
      segments.push("向前移动镜头 Move the camera forward.");
    } else if (s.forward > 3) {
      segments.push("将镜头转为特写镜头 Turn the camera to a close-up.");
    }

    // Tilt / Pitch
    if (s.tilt > 0.5) {
      segments.push("将镜头转为俯视图 Turn the camera to a bird's-eye view.");
    } else if (s.tilt < -0.5) {
      segments.push("将镜头转为仰视图 Turn the camera to a worm's-eye view.");
    }

    // Wide Angle
    if (s.wideAngle) {
      segments.push("将镜头转为广角镜头 Turn the camera to a wide-angle lens.");
    }

    return segments.join(" ");
  }, []);

  const generatedPrompt = useMemo(() => buildCameraPrompt(state), [state, buildCameraPrompt]);

  return {
    state,
    updateState,
    reset,
    generatedPrompt
  };
};
