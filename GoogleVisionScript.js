const S3 = require('aws-sdk/clients/s3');
const vision = require('@google-cloud/vision');
const imageClient = new vision.ImageAnnotatorClient();
const axios = require('axios');
const exif = require('exif-parser');
const fs = require('fs');

// Here we hide the pagination details
async function* ListObjects(s3, params) {
  let isTruncated = false;
  let token;
  do {
    const response = await s3.listObjectsV2({ 
        ...params, ContinuationToken: token
    }).promise();

    // One could also yield each item separately
    yield response.Contents;

    ({ IsTruncated: isTruncated, NextContinuationToken: token  } = response);
  } while (isTruncated)
}

async function getImageExif(url) {
  const buf = await axios.get(url, {
    responseType: 'arraybuffer'
  });
  const parser = exif.create(Buffer.from(buf.data));
  const resultParse = parser.parse();
  const result = {
    createdDate: resultParse.tags.CreateDate,
    model: resultParse.tags.Model,
    _geoloc: {
      lat: resultParse.tags.GPSLatitude,
      lng: resultParse.tags.GPSLongitude
    }
  };
  return result;
}

async function classifyImages(image){
  const imageToClassify = `${image}`;
  const results = await imageClient.labelDetection(imageToClassify);
  const labels = results[0].labelAnnotations;
  const labelsStripped = labels.map(label => {
     return {
       description: label.description,
       score: label.score
     }
   });
   return labelsStripped;
}
async function main() {
  const s3 = new S3({ params: { Bucket: 'iphoneimages2020' }});
  let s3BucketList= [];
  // Usage of the for-await syntax hides the pagination details
  for await (const contents of ListObjects(s3, { MaxKeys: 1000, Delimiter: '/'})) {
    const urls = contents.map(({ Key }) => 'https://iphoneimages2020.s3-us-west-1.amazonaws.com/' + Key);
    const miniurls = contents.map(({ Key }) => 'https://iphoneimages2020.s3-us-west-1.amazonaws.com/mini/' + Key);
    for(let i = 0; i < urls.length; i++) {
      s3BucketList.push({url:urls[i], miniurl: miniurls[i]});
  }
}
  for (let i = 0; i < s3BucketList.length; i++){
    const labels = await classifyImages(s3BucketList[i].url);
    s3BucketList[i].searchterms = labels;
    const exifData = await getImageExif(s3BucketList[i].url);
    s3BucketList[i] = {...s3BucketList[i], ...exifData};
  }
  return s3BucketList;
}

main()
.then((result) => {
  console.log(JSON.stringify(result,null,2));
  fs.writeFile('./PhotoDump.json', JSON.stringify(result,null,2), (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });
})
.catch((err) => {throw err;});
