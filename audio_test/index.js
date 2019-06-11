
const sr = 44100;
const nchannels = 2;
const length = sr * 40;

const audioCtx = new AudioContext();
const offlineCtx = new OfflineAudioContext(nchannels, length, sr);

// creates an audio buffer source node
const source = offlineCtx.createBufferSource();

const btn = document.querySelector('button');


function getData(){
  let request = new XMLHttpRequest();
  request.open('GET', 'viper.ogg', true);
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
              outputData[s] = inputData[s] + (Math.random() * 2 - 1) * 0.05
            }
          }
        }

        // Old: 
        song.connect(audioCtx.destination);
        // New:
        // song.connect(scriptNode);
        // scriptNode.connect(audioCtx.destination);

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
grabUserCamera();