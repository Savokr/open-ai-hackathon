import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';

const LightsCount = 5;
const LightInterval = 5; 
const PictureSize = 1.5;
const lights: THREE.Object3D [] = [];
const CorridorParams = {
  width: 4,
  height: 2,
  length: 40
}

const reuseVector = new THREE.Vector3();

// Create renderer
const canvasWrapper = document.getElementById('canvas-wrapper')!;
const renderer = new THREE.WebGLRenderer({antialias: true});
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

const corridorGeometry = new THREE.BoxGeometry(CorridorParams.width, CorridorParams.height, CorridorParams.length);
const corridorMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color('green'), side: THREE.DoubleSide});
const corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
corridor.receiveShadow = true;
scene.add(corridor);

const corridorBB = new THREE.Box3().setFromObject(corridor);

// Lights

const ambientLight = new THREE.AmbientLight(undefined, 0.3);
scene.add(ambientLight);

for (let i=1; i <= LightsCount; i++) {
    const areaLight = createAreaLight(scene);
    const areaLighHelper = new RectAreaLightHelper(areaLight);
    scene.add(areaLighHelper);
    areaLight.position.set(0,CorridorParams.height/2 - 0.01,i*LightInterval + corridorBB.min.z);
    areaLight.rotateX(-Math.PI/2)
    lights.push(areaLight);

    addPictures(i, scene, 'left');
    addPictures(i, scene, 'right');

}

const render = () => {
  renderer.render(scene, camera);
  //lights.forEach(li => li.rotateY(0.03));
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

function addPictures(index: number, scene: THREE.Scene, side: 'left' | 'right' = 'left') {
  const map = new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/RedCat_8727.jpg/1200px-RedCat_8727.jpg');
  const material = new THREE.MeshStandardMaterial({ map: map, } );
  const geometry = new THREE.PlaneGeometry(PictureSize, PictureSize);
  const plane = new THREE.Mesh(geometry, material);
  plane.castShadow = true;
  const sideCoef = (side === 'left') ? -1 : 1;
  plane.position.set(sideCoef*(CorridorParams.width/2 - 0.1), 0, index*LightInterval + corridorBB.min.z);
  plane.rotateY(sideCoef*-Math.PI/2)

  scene.add( plane );
}

// Cat picture https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/RedCat_8727.jpg/1200px-RedCat_8727.jpg