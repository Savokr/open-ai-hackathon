import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const LightsCount = 5;
const LightInterval = 5; 
const lights: THREE.Object3D [] = [];

const reuseVector = new THREE.Vector3();

// Create renderer
const canvasWrapper = document.getElementById('canvas-wrapper')!;
const renderer = new THREE.WebGLRenderer();
const domElement = renderer.domElement;
canvasWrapper.appendChild(domElement);
styleFullScreen(canvasWrapper);
styleFullScreen(domElement);

// Renderer settings
renderer.setSize( window.innerWidth, window.innerHeight);

// Create scene with camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 10000);
camera.position.set(0,0,3);
const scene = new THREE.Scene();
scene.background = new THREE.Color('black');

const controls = new OrbitControls(camera, domElement);
controls.target.set( 0, 0, 0 );
controls.update();

const corridorGeometry = new THREE.BoxGeometry(4, 2, 30);
const corridorMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color('green'), side: THREE.DoubleSide});
const corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
scene.add(corridor);

const corridorBB = new THREE.Box3().setFromObject(corridor);

// Lights

const ambientLight = new THREE.AmbientLight(undefined, 0.3);
scene.add(ambientLight);

for (let i=1; i <= LightsCount; i++) {
    const areaLight = createAreaLight(scene);
    areaLight.position.setZ(i*LightInterval + corridorBB.min.z);
    lights.push(areaLight);
}

const render = () => {
  renderer.render(scene, camera);
  lights.forEach(li => li.rotateY(0.03));
  requestAnimationFrame(render);
}

render();

function styleFullScreen(domElement: HTMLElement) {
  domElement.style.height = '100vh';
  domElement.style.width = '100vw';
  domElement.style.position = 'absolute';
  domElement.style.left = '0px';
  domElement.style.top = '0px';
}

function createAreaLight(scene: THREE.Scene): THREE.RectAreaLight {
  const areaLight = new THREE.RectAreaLight(undefined, 40, 0.5, 0.5);
  scene.add(areaLight);
  return areaLight;
}
