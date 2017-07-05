const stream = require('readable-stream');
// from https://github.com/mapbox/dbf/blob/c73e0bf9607fe323b7338db73ac4d80fc4266e0c/src/fieldsize.js
const sizes = {
  // string
  C: 254,
  // boolean
  L: 1,
  // date
  D: 8,
  // number
  N: 18,
  // number
  M: 18,
  // number, float
  F: 18,
  // number
  B: 8,
};
const blank = '                                ';
const dateRegex = /^(\d{4})-(\d\d)-(\d\d)/;
function lpad(string, length) {
  if (string.length > length) {
    return string;
  }
  var toPad = length - string.length;
  return blank.slice(0, toPad) + string;
}
function rpad(string, length) {
  if (string.length > length) {
    return string;
  }
  var toPad = length - string.length;
  return string + blank.slice(0, toPad);
}
const types = new Map([
  ['number', 'N'],
  ['character', 'C'],
  ['logical', 'L'],
  ['boolean', 'L'],
  ['bool', 'L'],
  ['date', 'D']
]);
class Dbf extends stream.Transform {
  constructor(schema, enc) {
    super({
      objectMode: true
    });
    this.fields = [];
    this.records = 0;
    this.recordSize = 1;
    this.enc = enc || 'ascii';
    for (let name in schema) {
      let value = schema[name];
      if (typeof value !== 'string') {
        continue;
      }
      value = value.toLowerCase();
      if (types.has(value)) {
        let type = types.get(value);
        this.recordSize += sizes[type];
        this.fields.push({
          name,
          type,
          length: sizes[type]
        });
      }
    }
  }
  _transform(chunk, _, next) {
    const out = Buffer.alloc(this.recordSize);
    var i = -1;
    out.writeUInt8(32, 0);
    let cur = 1;
    while (++i < this.fields.length) {
      let field = this.fields[i];
      let value = chunk[field.name];
      let type = field.type;
      let length = field.length;
      let parsed;
      switch (type) {
        case 'L':
          out.writeUInt8(value ? 84 : 70, cur);
          cur++;
          break;
        case 'N':
          if (typeof value !== 'number') {
            value = '';
          }
          out.write(lpad(value.toString(), length), cur, length, 'ascii');
          cur += length;
          break;
        case 'C':
          if (typeof value !== 'string') {
            value = '';
          }
          out.write(rpad(value, length), cur, length, this.enc);
          cur += length;
          break;
        case 'D':
          if (typeof value !== 'string' || !(parsed = dateRegex.exec(value))) {
            out.write(blank.slice(0, length), cur, length, 'ascii');
            cur += length;
            break;
          }
          out.write(parsed[1] + parsed[2] + parsed[3], cur, length, 'ascii');
          cur += length;
          break;
      }
    }
    this.records++;
    this.push(out);
    next();
  }
  _flush(done) {
    this.push(Buffer.from([0x1A]));
    done();
  }
  generateHeader() {
    const now = new Date();
    var headerlen = (32 * this.fields.length) + 1;
    const out = Buffer.alloc(headerlen + 32);
    out.writeUInt8(3, 0);
    out.writeUInt8(now.getFullYear() - 1900, 1);
    out.writeUInt8(now.getMonth() + 1, 2);
    out.writeUInt8(now.getDate(), 3);
    out.writeUInt32LE(this.records, 4);
    out.writeUInt16LE(headerlen + 32, 8);
    out.writeUInt16LE(this.recordSize, 10);
    out.writeInt8(0x0d, headerlen + 31);
    var i = -1;
    var cur = 32;
    while (++i < this.fields.length) {
      let field = this.fields[i];
      out.write(field.name, cur, 10, 'ascii');
      cur += 11;
      out.write(field.type, cur, 1, 'ascii');
      cur += 5;
      out.writeUInt8(field.length, cur);
      cur++;
      if (field.type === 'N') {
        out.writeInt8(3, cur);
      }
      cur += 15;
    }
    return out;
  }
}

module.exports = Dbf;
