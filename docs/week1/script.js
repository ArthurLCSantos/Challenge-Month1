import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

//CREATING INPUTS CONSTANTS AND VELOCITY VARIABLE
const canvas            =  document.querySelector("#C");
const sliderLP          =  document.getElementById('LP');
const sliderLA          =  document.getElementById('LA');
const sliderLD          =  document.getElementById('LD');
const sliderVel         =  document.getElementById('vel');
const checkBoxWireframe =  document.getElementById('wireframe');
const checkBoxHelpers   =  document.getElementById('helpers');
const colorPicker       =  document.getElementById('colorPicker');
const radiosColors      =  document.getElementsByName('color');
const radiosTextures    =  document.getElementsByName('radioTexture');
const input             =  document.getElementById('imageInput');
const buttonDelete      =  document.getElementById('buttonDelete');
let   vel               =  sliderVel.value;

//ADDING THE EVENT LISTENER TO INPUTS
sliderVel.addEventListener(        'input',          ()=>changeRotationalVelocity(sliderVel.value))
sliderLP.addEventListener(         'input',          ()=>changeDirectionalLightIntensity(sliderLP.value));
sliderLA.addEventListener(         'input',          ()=>changeAmbientLightIntensity(sliderLA.value));
sliderLD.addEventListener(         'input',          ()=>changeDirectionalLightRotation(sliderLD.value));
checkBoxWireframe.addEventListener('change',         changeWireframeMode)
checkBoxHelpers.addEventListener(  'change',         changeHelpersMode  )
Array.from(document.getElementsByName('color')).forEach((r) => r.onclick = radioColor)
Array.from(document.getElementsByName('radioTexture')).forEach((r) => r.onclick = radioTexture)
input.addEventListener(            'change',         ()=>changeTexture(URL.createObjectURL(input.files[0])));
colorPicker.addEventListener(      'input',          ()=>changeColor(colorPicker.value));
buttonDelete.addEventListener(     'click',          removeImage)

//CREATING SCENE, CAMERA, CONTROLS AND RENDERER
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); // aspect será ajustado depois
camera.position.set(0,2,-2)
camera.lookAt(0, 0, 0);
const controls = new OrbitControls(camera, canvas);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
function resizeRendererToDisplaySize() {
    const rect = canvas.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    renderer.setSize(width/2, height, false);
    renderer.setPixelRatio(window.devicePixelRatio*2);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

// LIGHTS
const directional = new THREE.DirectionalLight(0xffffff, 1)
directional.position.set(5,5,0); // luz vindo de cima e da frente

const target = new THREE.Object3D();
target.position.set(0,0,0); // alvo no centro da cena (cubo)
scene.add(target);

directional.target = target;
scene.add(directional);

const ambient = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambient);

//TEXTURE
const loader = new THREE.CubeTextureLoader()

//CUBE
const geo = new THREE.BoxGeometry();
const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00, wireframeLinewidth:5, side: THREE.DoubleSide });
const cube = new THREE.Mesh(geo, mat);

scene.add(cube);

//HELPERS
const helpers = new THREE.Group()
const axes = new THREE.AxesHelper(10)
const grid = new THREE.GridHelper(50,50)
const light = new THREE.DirectionalLightHelper(directional, 2);
helpers.add(light)
helpers.add(axes)
helpers.add(grid)
helpers.visible = false
scene.add(helpers)

//FUNCTION IN LOOP
function animate(t) {
    const time = 0.01

    cube.rotateY(time*vel)

    controls.update();
    renderer.render(scene, camera);
}

renderer.setClearColor(0x000000, 0.3);
renderer.setAnimationLoop(animate);

window.addEventListener('resize', resizeRendererToDisplaySize);
resizeRendererToDisplaySize();


//INPUTS EVENTS
function changeRotationalVelocity(newVel) {
    vel = newVel;
    document.getElementById('quantVel').innerText = newVel + "x";
}

function changeDirectionalLightIntensity(newIntensity) {
    directional.intensity = newIntensity;
    document.getElementById('quantLP').innerText = newIntensity;
}

function changeDirectionalLightRotation(newRotation) {
    const angle = THREE.MathUtils.degToRad(newRotation);
      // Atualiza a posição da luz
    directional.position.set(5 * Math.cos(angle), 5, 5 * Math.sin(angle));
    // Atualiza o helper (se necessário)
    directional.updateMatrixWorld();
    helpers.children[0].update();
    document.getElementById('quantLD').innerText = `${newRotation}°`;
}

function changeAmbientLightIntensity(newIntensity) {
    ambient.intensity = newIntensity;
    document.getElementById('quantLA').innerText = newIntensity;
}

function changeWireframeMode() {
    mat.wireframe = !mat.wireframe;
}

function changeHelpersMode() {
    helpers.visible = !helpers.visible
}

function radioColor() {
    for (let r of radiosColors) {
        if (r.checked) {
            switch (r.value) {
                case 'red':
                    mat.color = new THREE.Color(0xff0000);
                    break;
                case 'blue':
                    mat.color = new THREE.Color(0x0000ff);
                    break;
                case 'green':
                    mat.color = new THREE.Color(0x00ff00);
                    break;
                case 'yellow':
                    mat.color = new THREE.Color(0xffff00);
                    break;
                case 'white':
                    mat.color = new THREE.Color(0xffffff);
                    break;
            }
            break;
        }
    }
    document.getElementById('cardColor').style.backgroundColor = mat.color.getStyle();
}

function changeColor(color) {
    const card = document.getElementById('cardColor');

    mat.color = new THREE.Color(color);
    card.style.backgroundColor = color;
    radiosColors.forEach(r=>r.checked=false);
}

function radioTexture() {
    for (let r of radiosTextures) {
        if (r.checked) {
            changeTexture(r.value)
            break;
        }
    }
}

function changeTexture(url) {
    const cardUpload        =  document.getElementById('card');
    const buttonDelete      =  document.getElementById('buttonDelete');
    const uploadIcon        =  document.getElementById('upload-icon');

    if (url) {

        const loader = new THREE.TextureLoader()

        loader.load(url, texture => {
            if (cube.material.map) {
                cube.material.map.dispose();
            }
            cube.material.map = texture;
            cube.material.needsUpdate = true;
        })
        radiosColors[4].checked = true;
        radioColor()
        cardUpload.style.backgroundImage = `url(${url})`
        buttonDelete.style.display = "flex";
        uploadIcon.style.display   = 'none';
    }
}

function removeImage() {
    const cardUpload        =  document.getElementById('card');
    const uploadIcon        =  document.getElementById('upload-icon');

    cardUpload.style.backgroundImage = '';
    buttonDelete.style.display       = 'none';
    input.value                      = ''
    uploadIcon.style.display         = 'block'
    if (cube.material.map) {
        cube.material.map.dispose();
        cube.material.map = null;
        cube.material.needsUpdate = true;
        radioColor()
    }
}