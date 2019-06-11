
# What are typed arrays?

```{js}
function helloTypedArrays(){
  // typed arrays are meant to be fast - introduced to work in WEbGL
  let arr = new Uint16Array(10);
  console.log("Your array is", arr);
}
```

here's a fun thing u can do!
```
const buffer = new ArrayBuffer(8); // 8-byte ArrayBuffer.
const firstHalfView = new Int8Array(buffer, 0, 4);
const secondHalfView = new Int8Array(buffer, 4, 4);
firstHalfView[0] = 1
secondHalfView[0] = 2
console.log(buffer);
// [[Int8Array]]: Int8Array(8) [1, 0, 0, 0, 2, 0, 0, 0]
```

Typed arrays are just views of array buffers! (Alternatively, you can create the array and have the buffer in the background)
```
const typedArray = new Int8Array(5);
typedArray[1] = 2;
```


# Lots of things used typed arrays!

File API, XMLHttpRequest, Fetch API, window.postMessage() method and a lot of streaming APIs using typed arrays.


Yes, canvas image data is typed array:
```
var uint8ClampedArray = ctx.getImageData(...).data;
```
Useful to replace/analysing colors and for doing other kinds of image manipulation.

Yes, Web Sockets do support transferring binary data and ArrayBuffer representation of data. Enabling it is quiet easy:
```
webSocket.binaryType = 'arraybuffer';
```

Array Object construction is being done inside JavaScript VM and Array Objects are being allocated inside VM’s heap, while typed arrays allocated outside and involving the browser bindings.


# How does Tensorflow.js work?

Behind the scenes, it can have three different *backends*, or ways to do the computation faster!

Source: https://www.tensorflow.org/js/guide/platform_environment

1) Webgl

The first is webgl!

Sometimes your application needs to share the same GL context with TF.js so they can share data without having to pull textures off of the GPU. There are two ways to do this with TF.js: you can reuse the existing TF.js context, or pass your own context to TF.js.
