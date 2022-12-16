import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';
import { OpenApi } from './openai/openai';

const LightsCount = 6;
const LightInterval = 5;
const MovementSpeed = 0.03;
const PictureSize = 1.2;
const TextOffset = 0.2;
const lights: THREE.Object3D[] = [];
const CorridorParams = {
    width: 4,
    height: 2,
    length: 40,
};

// Create renderer
const canvasWrapper = document.getElementById('canvas-wrapper')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
const domElement = renderer.domElement;
canvasWrapper.appendChild(domElement);
styleFullScreen(canvasWrapper);
styleFullScreen(domElement);

// dom stuff
const blocker = document.getElementById('blocker')!;
const instructions = document.getElementById('instructions')!;
const inputField = document.getElementById('input-field')!;
inputField.addEventListener('click', (e) => e.stopPropagation());

// Renderer settings
renderer.setSize(window.innerWidth, window.innerHeight);

// Create scene with camera
const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    10000,
);
camera.position.set(0, 0, 3);
const scene = new THREE.Scene();
scene.background = new THREE.Color('black');

// FPS controls
const controls = new PointerLockControls(camera, document.body);
controls.addEventListener('lock', function () {

  instructions.style.display = 'none';
  blocker.style.display = 'none';

});

controls.addEventListener('unlock', function () {

  blocker.style.display = 'block';
  instructions.style.display = '';

});
instructions.addEventListener('click', function () {

  controls.lock();

});

let isMovingForward = false;
let isMovingLeft = false;
let isMovingRight = false;
let isMovingBack = false;

const onKeyDown = function (event: KeyboardEvent): void {
    switch (event.code) {
        case 'KeyW':
            isMovingForward = true;
            break;
        case 'KeyA':
            isMovingLeft = true;
            break;
        case 'KeyD':
            isMovingRight = true;
            break;
        case 'KeyS':
            isMovingBack = true;
            break;
    }
};
const onKeyUp = function (event: KeyboardEvent): void {
    switch (event.code) {
        case 'KeyW':
            isMovingForward = false;
            break;
        case 'KeyA':
            isMovingLeft = false;
            break;
        case 'KeyD':
            isMovingRight = false;
            break;
        case 'KeyS':
            isMovingBack = false;
            break;
    }
};
const moveWithKeyboard = () => {
  if (isMovingForward) {
    controls.moveForward(MovementSpeed);
  }
  if (isMovingLeft) {
    controls.moveRight(-MovementSpeed);
  }
  if (isMovingRight) {
    controls.moveRight(MovementSpeed);
  }
  if (isMovingBack) {
    controls.moveForward(-MovementSpeed);
  }
}

document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyUp, false);

const corridorGeometry = new THREE.BoxGeometry(
    CorridorParams.width,
    CorridorParams.height,
    CorridorParams.length,
);
const corridorMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('green'),
    side: THREE.DoubleSide,
});
const corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
corridor.receiveShadow = true;
scene.add(corridor);

const corridorBB = new THREE.Box3().setFromObject(corridor);

// Lights and scene objects

const ambientLight = new THREE.AmbientLight(undefined, 0.3);
scene.add(ambientLight);

// Content generation

const api = new OpenApi();
const images = api.getImagesFromTopic('Generate 12 phrases describing surroundings with ');
console.log(images);

for (let i = 1; i <= LightsCount; i++) {
    const areaLight = createAreaLight(scene);
    const areaLighHelper = new RectAreaLightHelper(areaLight);
    scene.add(areaLighHelper);
    areaLight.position.set(
        0,
        CorridorParams.height / 2 - 0.01,
        i * LightInterval + corridorBB.min.z,
    );
    areaLight.rotateX(-Math.PI / 2);
    lights.push(areaLight);

    addPicture(i, scene, 'left');
    addPicture(i, scene, 'right');

    addTextObject('Meow meow', scene, i, 'left');
    addTextObject('Meow meow', scene, i, 'right');
}

const render = (): void => {
    moveWithKeyboard();

    renderer.render(scene, camera);
    requestAnimationFrame(render);
};

render();

function styleFullScreen(domElement: HTMLElement): void {
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

function addPicture(
    index: number,
    scene: THREE.Scene,
    side: 'left' | 'right' = 'left',
): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> {
    const map = new THREE.TextureLoader().load(
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/RedCat_8727.jpg/1200px-RedCat_8727.jpg',
    );
    const material = new THREE.MeshStandardMaterial({ map: map });
    const geometry = new THREE.PlaneGeometry(PictureSize, PictureSize);
    const plane = new THREE.Mesh(geometry, material);
    plane.castShadow = true;
    const sideCoef = side === 'left' ? -1 : 1;
    plane.position.set(
        sideCoef * (CorridorParams.width / 2 - 0.1),
        0,
        index * LightInterval + corridorBB.min.z,
    );
    plane.rotateY((sideCoef * -Math.PI) / 2);

    scene.add(plane);
    return plane;
}

function addTextObject(
    text: string,
    scene: THREE.Scene,
    index: number,
    side: 'left' | 'right',
): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
    const canvas = document.createElement('canvas');
    const textureSize = 1024;
    canvas.width = textureSize;
    canvas.height = textureSize / 4;
    const context = canvas.getContext('2d')!;

    context.font = '48px serif';
    context.fillStyle = new THREE.Color('White').getStyle();
    context.fillText(text, 0, 50);

    const map = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
        map: map,
        transparent: true,
    });
    const geometry = new THREE.PlaneGeometry(PictureSize, PictureSize / 4);
    const plane = new THREE.Mesh(geometry, material);

    const sideCoef = side === 'left' ? -1 : 1;
    plane.position.set(
        sideCoef * (CorridorParams.width / 2 - 0.1),
        -(PictureSize / 2 + TextOffset),
        index * LightInterval + corridorBB.min.z,
    );
    plane.rotateY((sideCoef * -Math.PI) / 2);

    scene.add(plane);
    return plane;
}

// Cat picture https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/RedCat_8727.jpg/1200px-RedCat_8727.jpg
