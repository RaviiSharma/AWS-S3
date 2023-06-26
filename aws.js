const AWS = require('aws-sdk')
require('dotenv').config()


AWS.config.update({
  secretAccessKey: process.env.ACCESS_SECRET,
  accessKeyId: process.env.ACCESS_KEY,
  region: process.env.REGION,

});
const BUCKET = process.env.BUCKET
const s3 = new AWS.S3();


//const s3 = new AWS.S3({ appVersion: '2006-03-01' })
//const bucketName = "classroom-training-bucket";
const baseUrl = `https://${BUCKET}.s3.${AWS.config.region}.amazonaws.com/`;

var uploadFile = async (file, candidate_ref_no) => {
  return new Promise(function (resolve, reject) {

      const uploadParams = {
          ACL: "public-read",
          Bucket: BUCKET,
          Key: `abc-aws/${candidate_ref_no}/${file.originalname}`, // Include userName in the Key
          Body: file.buffer
      }

      s3.upload(uploadParams, function (err, data) {

          if (err) {
              console.log("file not uploaded")
              return reject({ error: err })
          }

          console.log("file uploaded successfully")
          console.log("IMP== ",data)
          return resolve(data.Location)
      });
  });
}

//____________________________________________________________________________

const download = async (candidate_ref_no) => {
  return new Promise((resolve, reject) => {
    const listParams = {
      Bucket: BUCKET,
      Prefix: `abc-aws/${candidate_ref_no}/`
    };
    const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
    s3.listObjectsV2(listParams, (err, data) => {

      if (err) {
          console.log("Specified key does not exist:", err);
          return reject({ error: 'Key not found' });
        }

      const url = data.Contents.map((item) => baseUrl+item.Key);
      console.log("Retrieved images", url);
      return resolve(url);
    });
        
    })
      
  };


// const getAllImages = async () => {
//   return new Promise((resolve, reject) => {
//     const listParams = {
//       Bucket: BUCKET,
//       Prefix: "abc-aws/"
     
//     };
//     const s3 = new AWS.S3({ appVersion: '2006-03-01' })
//     s3.listObjectsV2(listParams, (err, data) => {
//       if (err) {
//         console.log("Failed to retrieve images:", err);
//         return reject({ error: err });
//       }

//       const images = data.Contents.map((item) => baseUrl + item.Key);
//       console.log("Retrieved images",images);
//       //images.shift()
//       return resolve(images);
//     });
//   });
// };


   module.exports = { uploadFile,download,};


  