const axios = require('axios');
const exif = require('exif-parser');

async function getImageExif(url) {
  const buf = await axios.get(url, {
    responseType: 'arraybuffer'
  });
  const parser = exif.create(Buffer.from(buf.data));
  const result = parser.parse();
  console.log(JSON.stringify(result, null, 2));
}

getImageExif("https://iphoneimages2020.s3-us-west-1.amazonaws.com/IMG_5049.jpg").catch(err => {throw err;});