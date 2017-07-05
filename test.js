const stream = require('readable-stream');
// dif
// [ 60, 61, 62, 63, 64, 65, 66, 67, 103, 131, 159, 187 ] shp
// [ 60, 61, 62, 63, 64, 65, 66, 67, 107, 115, 123, 131 ] shx
const fs = require('fs');
const geojsonStream = require('geojson-stream');
const shpStream = require('./');
const _pump = require('pump');
const pump = function (from, to) {
  return new Promise((yes, no) => {
    _pump(from, to, err=>{
      if (err) {
        return no(err);
      }
      yes();
    })
  })
}
var co = require('co');
const input = fs.createReadStream('./test-data3.geojson').pipe(geojsonStream.parse());
// .pipe(new stream.Transform({
//   objectMode: true,
//   transform(chunk, _, next) {
//     chunk.properties.num = Math.random();
//     chunk.properties.name = 'hello';
//     this.push(chunk);
//     next();
//   }
// }));
const makeStream = (type, end) => {
  return fs.createWriteStream(`./test-out/testname-${type}.${end}`);
}
const schema = {
  num: 'number',
  name: 'character'
};
const handleStuff = co.wrap(function * (data) {
  for (let type in data) {
    let stuff = data[type];
    for (let ext in stuff) {
      let header = stuff[ext];
      const out = fs.createWriteStream(`./test-real/${type}.${ext}`);
      const input = fs.createReadStream(`./test-out/testname-${type}.${ext}`);
      out.write(header);
      yield pump(input, out);
      console.log('done', type, ext);
    }
  }
});
input.pipe(shpStream(schema, makeStream, (err, data)=>{
  console.log('done a', err);
  // console.log(handleStuff);
  handleStuff(data);
}));
