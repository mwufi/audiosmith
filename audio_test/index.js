
const sr = 44100;
const nchannels = 2;
const length = sr * 40;

const audioCtx = new AudioContext();
const offlineCtx = new OfflineAudioContext(nchannels, length, sr);

// creates an audio buffer source node
const source = offlineCtx.createBufferSource();

const btn = document.querySelector('button');

class Canvas {
  constructor(elem){
    this.canvas = document.querySelector(elem);
    
    if(this.canvas.getContext){
      this.ctx = this.canvas.getContext('2d');
    }

    this.width = 1024;
    this.height = 300;
    
    console.log(this.ctx);
  }

  clear(){
    this.ctx.fillStyle = "rgba(0, 120, 0, 0.01)";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
}

const HEIGHT = 300;

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
  console.log(bufferLength);

  let f = canvas.ctx;
  
  let print = 0;
  draw = () => {
    if (!analyser){
      console.log("ok");
      return;
    }

    analyser.getByteFrequencyData(dataArray);
    requestAnimationFrame(draw);

    canvas.clear();
    f.lineWidth = 2;
    f.strokeStyle = 'white';
    f.beginPath();

    if (print++ % 10 == 0) console.log(dataArray.slice(0, 50));

    let transform = x => x / 128.0;
    let sliceWidth = 1;
    let x = 0;
    for (let i=0; i < bufferLength; i++){
      var v = transform(dataArray[i])
      var y = v * HEIGHT / 2;

      if (i==0){
        f.moveTo(x, y);
      }else{
        f.lineTo(x, y);
      }

      x += sliceWidth;
    }

    f.lineTo(canvas.width, canvas.height/2);
    f.stroke();
  }

  return draw;
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

        // song.onended = () => {
        //   song.disconnect(scriptNode);
        //   scriptNode.disconnect(audioCtx.destination);
        // }

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