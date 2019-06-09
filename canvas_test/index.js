// these need to be accessed inside more than one function so we'll declare them first
let container;
let camera;
let renderer;
let scene;

let callbacks =[];
let stats;

// helper method for adding a rotating cube
function rotatingCube(x, y, z){

  // create a geometry
  const geometry = new THREE.BoxBufferGeometry( 0.23, 1, 0.5 );

  // create a default (white) Basic material
  const material = new THREE.MeshStandardMaterial( { color: 0x800080 } );

  // create a Mesh containing the geometry and material
  const mesh = new THREE.Mesh( geometry, material );

  mesh.position.set(x, y, z);
  
  const f = () => {
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;
    mesh.rotation.z += 0.01;
  }

  callbacks.push(f);
  
  return mesh;
}


let controls;
function createOrbitCamera( renderer ){
  // set up the options for a perspective camera
  const fov = 35; // fov = Field Of View
  const aspect = container.clientWidth / container.clientHeight;

  const near = 0.1;
  const far = 400;

  camera = new THREE.PerspectiveCamera( fov, aspect, near, far );

  // every object is initially created at ( 0, 0, 0 )
  // we'll move the camera back a bit so that we can view the scene
  camera.position.set( 0, 0, 10 );

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
  container = document.querySelector( '#scene-container' );

  // create a Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x8FBCD4 );
  addLights(scene);
  addObjects(scene);
  

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
  document.body.appendChild( stats.dom );

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