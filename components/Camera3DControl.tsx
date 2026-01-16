
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

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance" 
    });
    renderer.setPixelRatio(window.devicePixelRatio);
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

    const grid = new THREE.GridHelper(12, 12, 0x444444, 0x222222);
    scene.add(grid);

    const ringGeo = new THREE.TorusGeometry(2.5, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: 0x3b82f6, 
      transparent: true, 
      opacity: 0.4 
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    gizmoRingRef.current = ring;

    const cameraGroup = new THREE.Group();
    
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 })
    );
    cameraGroup.add(body);

    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.35, 0.6, 32),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.5;
    cameraGroup.add(lens);

    const coneGeo = new THREE.ConeGeometry(1, 2, 4, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({ 
      color: 0x3b82f6, 
      transparent: true, 
      opacity: 0.1, 
      wireframe: true 
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.rotation.x = -Math.PI / 2;
    cone.position.z = 1.5;
    cameraGroup.add(cone);
    coneRef.current = cone;

    scene.add(cameraGroup);
    modelCameraRef.current = cameraGroup;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const spotlight = new THREE.SpotLight(0xffffff, 100);
    spotlight.position.set(5, 10, 5);
    spotlight.angle = Math.PI / 6;
    scene.add(spotlight);

    const blueLight = new THREE.PointLight(0x3b82f6, 50);
    blueLight.position.set(-5, 2, -5);
    scene.add(blueLight);

    let isDragging = false;
    let isRotatingGizmo = false;
    let previousMouse = { x: 0, y: 0 };
    let startRotation = 0;
    let startAngle = 0;

    const getMousePosition = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1
      };
    };

    const getAngleFromCenter = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      return Math.atan2(e.clientY - centerY, e.clientX - centerX);
    };

    const onMouseDown = (e: MouseEvent) => {
      const pos = getMousePosition(e);
      mouse.set(pos.x, pos.y);
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(ring);
      if (intersects.length > 0) {
        isRotatingGizmo = true;
        startAngle = getAngleFromCenter(e);
        startRotation = stateRef.current.rotate;
        ringMat.opacity = 1.0;
        ringMat.color.set(0x60a5fa);
      } else {
        isDragging = true;
      }
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const pos = getMousePosition(e);
      mouse.set(pos.x, pos.y);
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(ring);
      
      if (!isRotatingGizmo && !isDragging) {
        if (intersects.length > 0) {
          ringMat.opacity = 0.8;
          renderer.domElement.style.cursor = 'crosshair';
        } else {
          ringMat.opacity = 0.4;
          renderer.domElement.style.cursor = 'grab';
        }
      }

      if (isRotatingGizmo) {
        const currentAngle = getAngleFromCenter(e);
        const deltaAngle = (currentAngle - startAngle) * (180 / Math.PI);
        onChange({ 
          rotate: Math.max(-90, Math.min(90, startRotation + deltaAngle))
        });
        renderer.domElement.style.cursor = 'grabbing';
        return;
      }

      if (isDragging) {
        const dx = e.clientX - previousMouse.x;
        const dy = e.clientY - previousMouse.y;
        onChange({ 
          rotate: Math.max(-90, Math.min(90, stateRef.current.rotate + dx * 0.5)),
          tilt: Math.max(-1, Math.min(1, stateRef.current.tilt - dy * 0.005))
        });
        previousMouse = { x: e.clientX, y: e.clientY };
        renderer.domElement.style.cursor = 'grabbing';
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      isRotatingGizmo = false;
      ringMat.opacity = 0.4;
      ringMat.color.set(0x3b82f6);
      renderer.domElement.style.cursor = 'grab';
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      containerRef.current?.removeChild(canvas);
    };
  }, [onChange]); 

  useEffect(() => {
    if (modelCameraRef.current) {
      modelCameraRef.current.rotation.y = THREE.MathUtils.degToRad(state.rotate);
      modelCameraRef.current.rotation.x = -state.tilt * (Math.PI / 4);
      modelCameraRef.current.position.z = state.forward * 0.4;
      
      // Visual feedback for floating: lift the model camera slightly in 3D view
      modelCameraRef.current.position.y = state.floating ? 1.5 : 0;
      
      if (coneRef.current) {
        const scale = state.wideAngle ? 2 : 1;
        coneRef.current.scale.set(scale, 1, scale);
        coneRef.current.material.opacity = state.wideAngle ? 0.2 : 0.1;
      }

      if (gizmoRingRef.current) {
        gizmoRingRef.current.position.copy(modelCameraRef.current.position);
      }
    }
  }, [state]);

  return (
    <div className="relative border border-gray-700 rounded-2xl overflow-hidden shadow-2xl bg-gray-950 group">
      <div ref={containerRef} className="w-full h-[350px] cursor-grab active:cursor-grabbing" />
      
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-blue-400 font-mono border border-blue-500/30 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          {state.floating ? 'LEVITATION_PIPELINE' : '3D_VIEWPORT_ACTIVE'}
        </div>
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-gray-400 font-mono border border-gray-800">
          ALT_Y: {state.floating ? '50cm' : '0cm'} | ROT_Y: {state.rotate.toFixed(1)}°
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1 flex items-center gap-2 pointer-events-none">
        <svg className="text-blue-500" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20"/></svg>
        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Gizmo Active</span>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-4 pointer-events-none">
        <div className="flex gap-1">
          <div className={`w-1 h-3 rounded-full ${state.floating ? 'bg-cyan-400' : 'bg-gray-700'}`} />
          <div className={`w-1 h-3 rounded-full ${state.wideAngle ? 'bg-blue-500' : 'bg-gray-700'}`} />
          <div className={`w-1 h-3 rounded-full ${state.rotate !== 0 ? 'bg-emerald-500' : 'bg-gray-700'}`} />
        </div>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Spatial Engine v2.1</span>
      </div>
    </div>
  );
};