// "use client"

// import { useEffect, useRef } from 'react';
// import * as THREE from 'three';
// import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// const App = () => {
//   const mountRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!mountRef.current) return;

//     const scene = new THREE.Scene();
//     const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
//     camera.position.set(0, 1.5, 3);

//     const renderer = new THREE.WebGLRenderer({ antialias: true });
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     mountRef.current.appendChild(renderer.domElement);

//     const controls = new OrbitControls(camera, renderer.domElement);
//     scene.add(new THREE.AmbientLight(0xffffff, 1));

//     const loader = new OBJLoader();
//     let original: THREE.Mesh | null = null;
//     let damaged: THREE.Mesh | null = null;

//     const checkLoaded = () => {
//       if (original && damaged) {
//         compareMeshes(original, damaged);
//       }
//     };

//     loader.load('/original.obj', (obj) => {
//       original = obj.children[0] as THREE.Mesh;
//       checkLoaded();
//     });

//     loader.load('/damaged.obj', (obj) => {
//       damaged = obj.children[0] as THREE.Mesh;
//       checkLoaded();
//     });

//     const compareMeshes = (original: THREE.Mesh, damaged: THREE.Mesh) => {
//       const origGeo = original.geometry.clone();
//       const dmgGeo = damaged.geometry.clone();

//       const origPos = origGeo.attributes.position as THREE.BufferAttribute;
//       const dmgPos = dmgGeo.attributes.position as THREE.BufferAttribute;

//       const colorArray = new Float32Array(dmgPos.count * 3);
//       const threshold = 0.01;

//       for (let i = 0; i < dmgPos.count; i++) {
//         const dx = dmgPos.getX(i) - origPos.getX(i);
//         const dy = dmgPos.getY(i) - origPos.getY(i);
//         const dz = dmgPos.getZ(i) - origPos.getZ(i);
//         const diff = Math.sqrt(dx * dx + dy * dy + dz * dz);

//         if (diff > threshold) {
//           colorArray[i * 3 + 0] = 1; // R
//           colorArray[i * 3 + 1] = 0; // G
//           colorArray[i * 3 + 2] = 0; // B
//         } else {
//           colorArray[i * 3 + 0] = 0.5;
//           colorArray[i * 3 + 1] = 0.5;
//           colorArray[i * 3 + 2] = 0.5;
//         }
//       }

//       dmgGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
//       const mat = new THREE.MeshStandardMaterial({ vertexColors: true });
//       const resultMesh = new THREE.Mesh(dmgGeo, mat);
//       scene.add(resultMesh);
//     };

//     const handleResize = () => {
//       if (!mountRef.current) return;
//       camera.aspect = window.innerWidth / window.innerHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(window.innerWidth, window.innerHeight);
//     };
//     window.addEventListener('resize', handleResize);

//     const animate = () => {
//       requestAnimationFrame(animate);
//       controls.update();
//       renderer.render(scene, camera);
//     };
//     animate();

//     return () => {
//       window.removeEventListener('resize', handleResize);
//       mountRef.current?.removeChild(renderer.domElement);
//     };
//   }, []);

//   return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
// };

// export default App;

"use client"

const DashboardPage = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <iframe
        src="https://bi-cn-hongkong.data.aliyun.com/token3rd/dashboard/view/pc.htm?pageId=4b89927d-033e-45ec-9eb0-6cf47c898700&accessTicket=452ece45-8d43-4c58-8339-d72df6cbbdb7&dd_orientation=auto"
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 'none' }}
      />
    </div>
  )
}

export default DashboardPage
