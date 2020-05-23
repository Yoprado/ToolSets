const S3 = require('aws-sdk/clients/s3');

let s3BucketList= [];
const vision = require('@google-cloud/vision');
const imageClient = new vision.ImageAnnotatorClient();

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

async function main() {
  const s3 = new S3({ params: { Bucket: 'iphoneimages2020' }});

  // Usage of the for-await syntax hides the pagination details
  for await (const contents of ListObjects(s3, { MaxKeys: 1000})) {
    const objects = contents.map(({ Key }) => 'https://iphoneimages2020.s3-us-west-1.amazonaws.com/' + Key);
    for(url of objects) {
      s3BucketList.push({URL:url});
    }
  }
}

main().then(() => classifyImage(s3BucketList[4].URL, function(imageLabels, dominantColors) { console.log(imageLabels, dominantColors);}));

// classifyImage() function
const classifyImage = (image, cb) => {
  console.log(image);
  // Use the locally stored image from the upload
  const imageToClassify = `${image}`;

  // Ask Google Vision what it thinks this is an image of
  imageClient
  .labelDetection(imageToClassify)
  .then(results => {
    const imageLabels = results[0].labelAnnotations;

      // Also ask for the dominant colors to use as search attributes
      imageClient
      .imageProperties(imageToClassify)
      .then(results => {
        const properties = results[0].imagePropertiesAnnotation;
        const dominantColors = properties.dominantColors.colors;

        // Pass both lists back in the callback
        cb(imageLabels, results);
      })
      .catch(err => {
        console.error('Error:', err);
      })
  })
  .catch(err => {
    console.error('Error:', err);
  });
};