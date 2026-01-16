
export interface CameraControlState {
  rotate: number; // -90 to 90
  forward: number; // 0 to 10
  tilt: number; // -1 to 1
  wideAngle: boolean;
  floating: boolean;
}

export interface GenerationSettings {
  seed: number;
  height: number;
  width: number;
  steps: number;
}

export interface ImageData {
  base64: string;
  mimeType: string;
  name: string;
  size: number;
  dimensions?: { width: number; height: number };
}

export interface GenerationResult {
  imageUrl: string;
  prompt: string;
  timestamp: number;
  settings: GenerationSettings;
  cameraState: CameraControlState;
}
