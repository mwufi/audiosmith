
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

loadModel().then(printModelWeights).then(evaluateNetSpeed);
