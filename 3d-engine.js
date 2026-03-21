const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(30);

// Create Floating Particles
const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.PointsMaterial({ size: 0.05, color: 0x6366f1 });
const particles = new THREE.Points(geometry, material);
scene.add(particles);

// Dynamic Lighting
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(pointLight, ambientLight);

// Mouse Interaction
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) / 100;
    mouseY = (e.clientY - window.innerHeight / 2) / 100;
});

function animate() {
    requestAnimationFrame(animate);
    
    particles.rotation.x += 0.001;
    particles.rotation.y += 0.002;
    
    // Smoothly follow mouse
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

// Logic for changing 3D color on theme toggle
window.update3DTheme = (isLight) => {
    material.color.setHex(isLight ? 0xec4899 : 0x6366f1);
};