
let model; 

const modelUrl =
'https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json';


function log(msg, default_messenger = "network"){
  const node = document.createElement("li");
  const d = new Date();
  const prefix = d.toLocaleTimeString() + " [" + default_messenger + "]\t";
  const textNode = document.createTextNode(prefix + msg);
  node.appendChild(textNode);
  document.querySelector("#console").appendChild(node);
}

async function loadModel(){
  log("Loading model...")
  model = await tf.loadGraphModel(modelUrl);
}

function printModelWeights(){
  log("Model loaded!")

  for(let layer in model.weights){
    log(layer)
    log(model.weights[layer][0].shape)
  }
}

function evaluateNetSpeed(){
  log("Starting evaluations", "evaluator");
  let start = Date.now();
  for(let i = 0; i < 400; i++){
    const zeros = tf.zeros([1, 224, 224, 3]);
    const b = model.predict(zeros)
  }
  let elapsed = Date.now() - start;
  log(elapsed + " milliseconds", "evaluator");
}

// these need to be accessed inside more than one function so we'll declare them first
let container;
let camera;
let renderer;
let scene;

let callbacks =[];
let stats;

// helper method for adding a rotating cube
function rotatingCube(x, shape){

  // create a geometry
  const geometry = new THREE.BoxBufferGeometry( shape[0]/10, shape[1]/10, shape[2]/10 );

  // create a default (white) Basic material
  const material = new THREE.MeshStandardMaterial( { color: 0x800080 } );

  // create a Mesh containing the geometry and material
  const mesh = new THREE.Mesh( geometry, material );

  mesh.position.set(x, 0, 0);
  
  const f = () => {
    mesh.rotation.x += 0.01;
    // mesh.rotation.y += 0.01;
    // mesh.rotation.z += 0.01;
  }

  callbacks.push(f);
  
  return mesh;
}

function displayModel(scene){

  let x = 0;
  for(let layer in model.weights){
    let size = model.weights[layer][0].shape;
    log(size);
    x += 1;

    while (size.length < 3){
      size.unshift(1);
    }
    log(size);
    scene.add( rotatingCube(x, size.slice(-3)) );
  }
}

let controls;
function createOrbitCamera( renderer ){
  // set up the options for a perspective camera
  const fov = 35; // fov = Field Of View
  const aspect = container.clientWidth / container.clientHeight;

  const near = 0.1;
  const far = 1000;

  camera = new THREE.PerspectiveCamera( fov, aspect, near, far );

  // every object is initially created at ( 0, 0, 0 )
  // we'll move the camera back a bit so that we can view the scene
  camera.position.set( 100, 0, 0 );

  controls = new THREE.OrbitControls( camera, renderer.domElement  );
}

function addLights( scene ){

  // Create a directional light
  let light = new THREE.DirectionalLight( 0xffffff, 5.0 );

  // move the light back and up a bit
  light.position.set( 2, 10, -10 );

  // remember to add the light to the scene
  scene.add( light );


  // Create a directional light
  light = new THREE.DirectionalLight( 0xffffff, 2.0 );

  // move the light back and up a bit
  light.position.set( 10, 10, 10 );

  // remember to add the light to the scene
  scene.add( light );
}

function addObjects ( scene ){
  const objects = 80; // seems to be the limit of this demo

  // add the mesh to the scene object
  for(let j = -objects; j < objects; j += 1){
    // add the mesh to the scene object
    for(let i = -objects; i < objects; i += 1){
      scene.add( rotatingCube(i, -j/2, -j) );
    }
  }
}


function init() {

  // Get a reference to the container element that will hold our scene
  container = document.querySelector( '#scene_container' );

  // create a Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x8FBCD4 );
  addLights(scene);

  // create a WebGLRenderer and set its width and height
  renderer = new THREE.WebGLRenderer( { antialias: true });
  renderer.setSize( container.clientWidth, container.clientHeight );

  renderer.setPixelRatio( window.devicePixelRatio );

  // add the automatically created <canvas> element to the page
  container.appendChild( renderer.domElement );

  // add orbit controls and a camera
  createOrbitCamera( renderer );

  // add the stats counter!!
  stats = new Stats();
  stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.querySelector("#scene_container").appendChild( stats.dom );

  loadModel().then(() => displayModel(scene)).then(evaluateNetSpeed);
  log("Waiting for stuff");
}

function animate() {

  requestAnimationFrame( animate );

  stats.begin()

  // increase the mesh's rotation each frame
  for(let i = 0; i< callbacks.length; i++){
    callbacks[i]();
  }

  controls.update();

  // render, or 'create a still image', of the scene
  renderer.render( scene, camera );

  stats.end();

}

// call the init function to set everything up
init();

// then call the animate function to render the scene
animate();