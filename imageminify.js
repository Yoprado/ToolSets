const path = require("path")
const fs = require("fs")
const sharp = require('sharp');
 
const directoryPath = path.join(__dirname, "s3Import")
 
fs.readdir(directoryPath, function(err, files) {
  if (err) {
    console.log("Error getting directory information.")
  } else {
    files.forEach(function(file) {
      console.log(file)
      let newFile = file.replace("jpg", "jpg");
      sharp("./s3Import/" + file)
        .resize({ height: 100})
        .toFile("./mini/" + newFile)
    })
  }
})