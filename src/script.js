import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import GUI from 'lil-gui';

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Models
 */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

let mixer = null;
let fractal;
gltfLoader.load(
    '/models/untitled.glb',
    (gltf) => {
        scene.add(gltf.scene);
        fractal = gltf.scene;
    }
);

/**
 * Floor
 */

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 10);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xfffffff, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// GUI for DirectionalLight
const lightFolder = gui.addFolder('Light');
lightFolder.addColor({ color: directionalLight.color.getHex() }, 'color')
    .name('Color')
    .onChange((value) => {
        directionalLight.color.set(value);
    });
lightFolder.add(directionalLight, 'intensity', 0, 20, 0.1).name('Intensity');

/**
 * Sizes
 */
const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load('/textures/particles/8.png');

/**
 * Particles
 */
// Geometry
const particlesGeometry = new THREE.BufferGeometry();
const count = 50000;

const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count * 4; i++) {
    positions[i] = (Math.random() - 0.5) * 15;
    colors[i] = Math.random();
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// Material
const particlesMaterial = new THREE.PointsMaterial();

particlesMaterial.size = 0.05;
particlesMaterial.sizeAttenuation = true;

particlesMaterial.color = new THREE.Color('#fffff');

particlesMaterial.transparent = false;
particlesMaterial.alphaMap = particleTexture;
particlesMaterial.depthWrite = false;
particlesMaterial.blending = THREE.AdditiveBlending;

particlesMaterial.vertexColors = false;

// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener('dblclick', () => {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;

    if (!fullscreenElement) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        } else if (canvas.webkitRequestFullscreen) {
            canvas.requestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.exitFullscreen();
        }
    }
});

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.set(1, 4, 1);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.enablePan = false;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;
const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    if (fractal) {
        fractal.position.y = Math.sin(elapsedTime * 0.01) * 0.1;
        fractal.rotation.x += 0.00;
        fractal.rotation.z -= 0.005;
    }
    // if (directionalLight) {
    //  directionalLight.position.y = Math.sin(elapsedTime *0.8) * 5;
    //  directionalLight.position.x = Math.cos(elapsedTime *0.8) * 5;
    // }
    
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    if (mixer) {
        mixer.update(deltaTime);
    }

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera,directionalLight );

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();

/**
 * Screenshot button
 */
const downloadButton = document.createElement('button');
downloadButton.id = 'downloadButton'; // Added ID here
downloadButton.innerText = 'Download Screenshot';
document.body.appendChild(downloadButton);

downloadButton.addEventListener('click', () => {
    renderer.render(scene, camera); // Render the scene

    const screenshot = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = screenshot;
    link.download = 'screenshot.png';
    link.click();
});
