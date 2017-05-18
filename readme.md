shp-write-stream
===

Want to create a shapefile in a streaming manner?

Well you can't but this is the next best thing.

```bash
npm install --save shp-stream
```


```js
const shpStream = require('shp-write-stream');

const inputStream = shpStream(schema, makeStream, [options,] callback);
```

Takes 2 arguments and a callback, returns a writable stream.

The stream is an object stream which takes geojson feature objects.

First argument is a schema object where the key is the name of the property and the value is the type, one of `number`, `character`, `logical`, `date`.

Second argument is a function you need to provide that will be called with 2 arguments, shape type and file extension .e.g. `point` and `dbf` and it needs to return a writable stream where the shapefile component corresponding to that shapetype will be written to.

The options currently it only accepts `preferPoint` which defaults to `true` if set to false then we create a single multipoint shapefile for both points and multipoints, if true (the default) we create a point shapefile for points and a multipoint for multipoints.

The callback is called with 2 arguments, error and headers, the headers need to be put at the beginning of the streams that have been written (hence why you can't truly stream them).  The structure of the header object is at the top level you have a key for each shapetype in the output, and bellow that an object with a key for each extension type with the value being the buffer with the header in it.  The output if there was a polygon and linestring features would be

```js
{
  line: {
    shp: <buffer>,
    shx: <buffer>,
    dbf: <buffer>
  },
  polygon: {
    shp: <buffer>,
    shx: <buffer>,
    dbf: <buffer>
  }
}
```

Acknowledgements
===

Much of this would be impossible without [Tom MacWright's](https://macwright.org/) work on [shp-write](https://github.com/mapbox/shp-write).
