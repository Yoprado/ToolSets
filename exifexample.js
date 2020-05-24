const exif = require('exif-parser');
const fs = require('fs');
const https = require('https');
const buffer = fs.readFileSync("./IMG_5049.jpg");
const parser = exif.create(buffer);
const result = parser.parse();

//console.log(JSON.stringify(result, null, 2));

function getImage(url, callback) {
  https.get(url, res => {
      // Initialise an array
      const bufs = [];

      // Add the data to the buffer collection
      res.on('data', function (chunk) {
          bufs.push(chunk)
      });

      // This signifies the end of a request
      res.on('end', function () {
          // We can join all of the 'chunks' of the image together
          const data = Buffer.concat(bufs);

          // Then we can call our callback.
          callback(null, data);
      });
  })
  // Inform the callback of the error.
  .on('error', callback);
}

// Then you 'get' your image like so:
getImage('https://iphoneimages2020.s3-us-west-1.amazonaws.com/IMG_5049.jpg', function (err, data) {
  // Handle the error if there was an error getting the image.
  if (err) {
      throw new Error(err);
  }
  const parser2 = exif.create(data);
const result2 = parser2.parse();

console.log(JSON.stringify(result2, null, 2));

})