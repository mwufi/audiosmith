import * as mobilenet from '@tensorflow-models/mobilenet';

async function run(img: HTMLImageElement) {
  // Load the MobileNetV2 model.
  const model = await mobilenet.load(1, 1.0);

  // Classify the image.
  const predictions = await model.classify(img);
  console.log('Predictions');
  console.log(predictions);
}

// Ensure to load the image.
window.onload = (e) => {
  const img = document.getElementById('img') as HTMLImageElement;
  run(img);
}