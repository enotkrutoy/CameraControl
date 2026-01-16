
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraControlState } from '../types';

interface Props {
  state: CameraControlState;
  onChange: (updates: Partial<CameraControlState>) => void;
}

export const Camera3DControl: React.FC<Props> = ({ state, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelCameraRef = useRef<THREE.Group | null>(null);
  const coneRef = useRef<THREE.Mesh | null>(null);
  const gizmoRingRef = useRef<THREE.Mesh | null>(null);
  const targetRef = useRef<THREE.Mesh | null>(null);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(10, 8, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance" 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = 350;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);
    handleResize();

    // Enhanced Grid
    const grid = new THREE.GridHelper(20, 20, 0x1e293b, 0x0f172a);
    scene.add(grid);

    // Target Subject Representation
    const targetGeo = new THREE.IcosahedronGeometry(1, 1);
    const targetMat = new THREE.MeshStandardMaterial({ 
      color: 0x3b82f6, 
      wireframe: true,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.5
    });
    const target = new THREE.Mesh(targetGeo, targetMat);
    scene.add(target);
    targetRef.current = target;

    // Gizmo Orbit Ring
    const ringGeo = new THREE.TorusGeometry(4, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.2 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    gizmoRingRef.current = ring;

    // Camera Group
    const cameraGroup = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.6, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 1, roughness: 0.2 })
    );
    cameraGroup.add(body);

    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 0.5, 32),
      new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 1, roughness: 0.1 })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.4;
    cameraGroup.add(lens);

    // Dynamic Frustum
    const coneGeo = new THREE.ConeGeometry(1.2, 3, 4, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({ 
      color: 0x3b82f6, 
      transparent: true, 
      opacity: 0.05, 
      wireframe: true 
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.rotation.x = -Math.PI / 2;
    cone.position.z = 1.9;
    cameraGroup.add(cone);
    coneRef.current = cone;

    scene.add(cameraGroup);
    modelCameraRef.current = cameraGroup;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const mainLight = new THREE.DirectionalLight(0xffffff, 2);
    mainLight.position.set(10, 20, 10);
    scene.add(mainLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 20);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);

    let isDragging = false;
    let isRotatingGizmo = false;
    let previousMouse = { x: 0, y: 0 };
    let startRotation = 0;
    let startAngle = 0;

    const onMouseDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      if (raycaster.intersectObject(ring).length > 0) {
        isRotatingGizmo = true;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        startRotation = stateRef.current.rotate;
      } else {
        isDragging = true;
      }
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isRotatingGizmo) {
        const rect = renderer.domElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const delta = (currentAngle - startAngle) * (180 / Math.PI);
        onChange({ rotate: Math.max(-90, Math.min(90, startRotation + delta)) });
      } else if (isDragging) {
        const dx = e.clientX - previousMouse.x;
        const dy = e.clientY - previousMouse.y;
        onChange({ 
          rotate: Math.max(-90, Math.min(90, stateRef.current.rotate + dx * 0.5)),
          tilt: Math.max(-1, Math.min(1, stateRef.current.tilt - dy * 0.005))
        });
        previousMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', () => { isDragging = false; isRotatingGizmo = false; });

    const animate = () => {
      requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener('mousedown', onMouseDown);
      renderer.dispose();
    };
  }, [onChange]); 

  useEffect(() => {
    if (modelCameraRef.current && targetRef.current) {
      const angle = THREE.MathUtils.degToRad(state.rotate);
      const distance = 6 - state.forward * 0.3;
      
      // Orbit position
      modelCameraRef.current.position.x = Math.sin(angle) * distance;
      modelCameraRef.current.position.z = Math.cos(angle) * distance;
      modelCameraRef.current.position.y = (state.tilt * 4) + (state.floating ? 1.5 : 0);
      
      modelCameraRef.current.lookAt(0, state.floating ? 1.5 : 0, 0);

      // Target position
      targetRef.current.position.y = state.floating ? 1.5 : 0;
      
      if (coneRef.current) {
        const scale = state.wideAngle ? 2.5 : 1;
        coneRef.current.scale.set(scale, 1, scale);
        coneRef.current.material.opacity = state.wideAngle ? 0.15 : 0.05;
      }
    }
  }, [state]);

  return (
    <div className="relative border border-white/5 rounded-[2rem] overflow-hidden bg-black/40 backdrop-blur-md">
      <div ref={containerRef} className="w-full h-[350px] cursor-move" />
      <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-[2rem]" />
      
      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          <span className="text-[10px] font-black font-mono text-blue-400 uppercase tracking-widest">Spatial_Engine_v3.2</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
        <div className="space-y-1 font-mono text-[9px] text-gray-500 uppercase font-bold">
          <p>AZIMUTH: {state.rotate.toFixed(1)}°</p>
          <p>PITCH: {(state.tilt * 45).toFixed(1)}°</p>
          <p>ELEVATION: {state.floating ? '50.00cm' : '0.00cm'}</p>
        </div>
        <div className="flex gap-1.5">
          <div className={`w-1 h-4 rounded-full transition-all ${state.floating ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-white/10'}`} />
          <div className={`w-1 h-4 rounded-full transition-all ${state.wideAngle ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`} />
          <div className={`w-1 h-4 rounded-full transition-all ${state.rotate !== 0 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-white/10'}`} />
        </div>
      </div>
    </div>
  );
};
