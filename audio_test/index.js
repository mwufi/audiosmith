
const sr = 44100;
const nchannels = 2;
const length = sr * 40;

const audioCtx = new AudioContext();
const offlineCtx = new OfflineAudioContext(nchannels, length, sr);

// creates an audio buffer source node
const source = offlineCtx.createBufferSource();

const btn = document.querySelector('button');
const DATASHAPE = [1024, 1];

function getModel(){
  const input = tf.input({shape: DATASHAPE});

  // First layer uses relu activation, second layer uses softmax activation
  const conv1 = tf.layers.conv1d({kernelSize: 10, filters: 4, stride: 1, dilationRate: 4, activation: 'relu', kernelInitializer: 'leCunNormal'});
  const conv2 = tf.layers.conv1d({kernelSize: 10, filters: 4, stride: 5, dilationRate: 1, activation: 'softmax', kernelInitializer: 'leCunNormal'});
  const conv3 = tf.layers.conv1d({kernelSize: 10, filters: 4, stride: 5, dilationRate: 1, activation: 'softmax', kernelInitializer: 'leCunNormal'});

  // Obtain the output symbolic tensor by applying the layers on the input.
  // const output = conv2.apply(conv1.apply(input));

  // Create the model based on the inputs.
  const model = tf.model({inputs: input, outputs: conv3.apply(conv2.apply(conv1.apply(input)))});

  console.log("THIS IS MODEL")
  console.log(model);
  return model;

}

let model = getModel();


/* Tests to see if the model can take a 1024x1 input
*/
function testNetwork(dataArray){
  let real = tf.tensor1d(dataArray);
  const dreal = real.reshape([1].concat(DATASHAPE));

  dreal.data().then( x => console.log("Tensor input:", x.length, x.slice(0, 20)));
  model.predict(dreal).data().then( x => console.log("Model output:", x.length, x.slice(0, 20)));
}

let print = 0;
function runNetwork(dataArray, callback){
  let real = tf.tensor1d(dataArray);
  const dreal = real.reshape([1].concat(DATASHAPE));
  model.predict(dreal).data().then(callback);
}

/* Returns a draw() function that you can call to start the
   drawing process
*/
function setUp(analyser, canvas){
  if (!analyser){
    console.log("Analyser node not set up yet...");
    return;
  }

  analyser.fftSize = 2048;
  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);
  console.log("Buffer length", bufferLength);

  testNetwork(dataArray);

  draw = () => {
    if (!analyser){
      console.log("ok");
      return;
    }

    analyser.getByteTimeDomainData(dataArray);
    requestAnimationFrame(draw);

    
    canvas.wash();
    runNetwork(dataArray, output => {
      canvas.plot(output, x => x);
      if (print++ % 10 == 0) console.log("Tensor output:", output.length, output.slice(0, 50));
    });

  }

  return draw;
}


class Canvas {
  constructor(elem){
    this.canvas = document.querySelector(elem);
    
    if(this.canvas.getContext){
      this.ctx = this.canvas.getContext('2d');
    }

    this.width = 1024;
    this.height = 600;
    
    console.log(this.ctx);
  }

  wash(){
    this.ctx.fillStyle = "rgba(0, 60, 0, 0.1)";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  plot(dataArray, transform = null){
    if (!this.ctx){
      console.log("Unable to get canvas!");
      return;
    }

    let f = this.ctx;
    f.lineWidth = 2;

    let preprocess = transform? transform : (x => x);
    let cumulative = 0;

    let sliceWidth = 2;
    let width = this.width /2;

    let rows = Math.round(dataArray.length / width);

    const makeColor = row => {
      const transparency = 1.0;
      return 'rgba(255,255,255,' + transparency + ')';
    }

    // changing this part lets you choose which part of the data to see
    for(let row = 0; row < rows; row++){
      f.strokeStyle = makeColor(row);
      f.beginPath();
      let x = 0;
      for (let i=0; i < width; i++){
        var v = preprocess(dataArray[i + row * width]);
        var y = v * this.height / 2 + 0.9 * this.height * row / rows;
  
        if (i==0){
          f.moveTo(x, y);
        }else{
          f.lineTo(x, y);
        }
  
        x += sliceWidth;
      }
      f.stroke();
    }
  }
}


function getData(){
  let canvas = new Canvas('#output');
  
  let request = new XMLHttpRequest();
  request.open('GET', 'StreetDrone.mp3', true);
  request.responseType = 'arraybuffer';

  request.onload = () => {
    var audioData = request.response;
    audioCtx.decodeAudioData(audioData, function(buffer) {
      myBuffer = buffer;

      source.buffer = myBuffer;
      source.connect(offlineCtx.destination);
      source.start();

      offlineCtx.startRendering().then(function(renderedBuffer) {
        console.log('Rendering completed!');
        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var song = audioCtx.createBufferSource();
        song.buffer = renderedBuffer;


        // Create a ScriptProcessorNode with a bufferSize of 4096 and a single input and output channel
        var scriptNode = audioCtx.createScriptProcessor(4096, 2, 2);

        scriptNode.onaudioprocess = (event) => {
          var inputBuffer = event.inputBuffer;
          var outputBuffer = event.outputBuffer; // where did this come from?
          
          for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++){
            var inputData = inputBuffer.getChannelData(channel);
            var outputData = outputBuffer.getChannelData(channel);
            
            // Loop through the 4096 samples
            for (var s = 0; s < inputBuffer.length; s++){
              outputData[s] = inputData[s];
            }
          }
        }

        // Create an AnalyserNode
        let analyser = audioCtx.createAnalyser();
        const drawfn = setUp(analyser, canvas);
        drawfn();

        // Old: 
        // song.connect(audioCtx.destination);
        // New:

        song.connect(scriptNode);
        scriptNode.connect(analyser);
        analyser.connect(audioCtx.destination);

        song.onended = () => {
          song.disconnect(scriptNode);
          scriptNode.disconnect(analyser);
          analyser.disconnect(audioCtx.destination);
        }

        btn.onclick = () => {
          song.start();
        };

      }).catch(err => {
        console.log('Rendering failed', err);
      });
    })
  }

  request.send();
}

getData()

// getUserMedia block - grab stream
// put it into a MediaStreamAudioSourceNode
// also output the visuals into a video element 
const video = document.querySelector('video');
function grabUserCamera(){
  if (navigator.mediaDevices){
    console.log('getuserMedia supported');
    navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(stream => {
      video.srcObject = stream;
      video.onloadedmetadata = e => {
        video.play();
        video.muted = true;
      }
    })
  }else{
    console.log("Nope!")
  }
}
// grabUserCamera();