// src/three-examples.d.ts

declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import * as THREE from 'three';

  export class GLTFLoader extends THREE.Loader {
    constructor(manager?: THREE.LoadingManager);
    load(
      url: string,
      onLoad: (gltf: { scene: THREE.Group; scenes: THREE.Group[]; animations: THREE.AnimationClip[] }) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }
}

declare module 'three/examples/jsm/controls/OrbitControls' {
  import * as THREE from 'three';

  export class OrbitControls extends THREE.EventDispatcher {
    constructor(camera: THREE.Camera, domElement?: HTMLElement);

    object: THREE.Camera;
    enabled: boolean;
    target: THREE.Vector3;
    minDistance: number;
    maxDistance: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    keyPanSpeed: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string };
    mouseButtons: { LEFT: number; MIDDLE: number; RIGHT: number };

    update(): boolean;
    dispose(): void;
    reset(): void;
  }
}
