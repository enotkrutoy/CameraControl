
import { CameraControlState, GenerationSettings } from './types';

export const DEFAULT_CAMERA_STATE: CameraControlState = {
  rotate: 0,
  forward: 0,
  tilt: 0,
  wideAngle: false,
};

export const DEFAULT_SETTINGS: GenerationSettings = {
  seed: Math.floor(Math.random() * 2147483647),
  height: 1024,
  width: 1024,
  steps: 4,
};

export const ROTATE_LIMITS = { min: -90, max: 90 };
export const FORWARD_LIMITS = { min: 0, max: 10 };
export const TILT_LIMITS = { min: -1, max: 1 };
export const DIMENSION_LIMITS = { min: 256, max: 1024, step: 64 };
export const STEPS_LIMITS = { min: 1, max: 40 };

export const MODEL_NAME = 'gemini-3-flash-preview';
