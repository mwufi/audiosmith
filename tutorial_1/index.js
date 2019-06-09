


let recognizer;

function predictWord() {
 // Array of words that the recognizer is trained to recognize.
 const words = recognizer.wordLabels();
 recognizer.listen(({scores}) => {
		// Turn scores into a list of (score,word) pairs.
		scores = Array.from(scores).map((s, i) => ({score: s, word: words[i]}));
		console.log(scores);
		// Find the most probable word.
		scores.sort((s1, s2) => s2.score - s1.score);
		document.querySelector('#console').textContent = scores[0].word;
 }, {probabilityThreshold: 0.75});
}

// One frame is ~23ms of audio.
const NUM_FRAMES = 3;
let examples = [];

function collect(label){
	if (recognizer.isListening()){
		return recognizer.stopListening();
	}
	if (label == null){
		return;
	}

	// here, we use a model that we've already built
	// the listen() method probably returns an object with
	// the following properties:
	// - spectrogram (frameSize, data, ...)
	// - scores
	// - etc.
	recognizer.listen(async ({spectrogram: {frameSize, data}})=> {
		let vals = normalize(data.subarray(-frameSize * NUM_FRAMES));
		examples.push({vals, label});
		document.querySelector('#console').textContent = 
			`${examples.length} examples collected!`;
	}, {
		overlapFactor: 0.999,
		includeSpectrogram: true,
		invokeCallbackOnNoiseAndUnknown: true
	});

}

function normalize(x) {
 const mean = -100;
 const std = 10;
 return x.map(x => (x - mean) / std);
}

function flatten(tensors){
	const size = tensors[0].length;
	const result = new Float32Array(tensors.length * size);
	tensors.forEach((arr,i) => result.set(arr, i * size));
	return result;
}

const INPUT_SHAPE = [NUM_FRAMES, 232, 1];
let model;

function buildModel() {
	model = tf.sequential();
	model.add(tf.layers.depthwiseConv2d({
		depthMultiplier: 8,
		kernelSize: [NUM_FRAMES, 3],
		activation: 'relu',
		inputShape: INPUT_SHAPE
	}));
	model.add(tf.layers.maxPooling2d({poolSize: [1, 2], strides: [2, 2]}));
	model.add(tf.layers.flatten());
	model.add(tf.layers.dense({units: 3, activation: 'softmax'}));
	const optimizer = tf.train.adam(0.01);
	model.compile({
		optimizer,
		loss: 'categoricalCrossentropy',
		metrics: ['accuracy']
	});
}

async function train(){
	const ys = tf.oneHot(examples.map(e => e.label), 3);
	const xsShape = [examples.length, ...INPUT_SHAPE];
	const xs = tf.tensor(flatten(examples.map(e => e.vals)), xsShape);

	// tfjs has a keras-like api
	await model.fit(xs, ys, {
		batchSize: 16,
		epochs: 10,
		callbacks: {
			onEpochEnd: (epoch, logs) => {
				document.querySelector('#console').textContent = 
					`Accuracy: ${(logs.acc * 100).toFixed(1)}% Epoch: ${epoch + 1}`
			}
		}
	});

	tf.dispose([xs, ys]);
}

async function app() {
	recognizer = speechCommands.create('BROWSER_FFT');
	await recognizer.ensureModelLoaded();

	buildModel();
}

app();