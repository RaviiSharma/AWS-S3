const AWS = require('aws-sdk')
require('dotenv').config()

//AWS credential 
AWS.config.update({
  secretAccessKey: process.env.ACCESS_SECRET,
  accessKeyId: process.env.ACCESS_KEY,
  region: process.env.REGION,

});
const BUCKET = process.env.BUCKET
const s3 = new AWS.S3();

const baseUrl = `https://${BUCKET}.s3.${AWS.config.region}.amazonaws.com/`;

//_______________________________________________________________________________________________________________________________________________
  
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
app.use(bodyParser.json());
app.use(multer().any());

const knex = require("knex");

const db = knex({client: "mysql",connection: {host: "localhost",user: "root",database: "attendance_dev", password: ""}});

//______________________________________________________/ aws functions /__________________________________________________________________

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
//___________________________________________________________/ API /______________________________________________________


const isValidImageType = function (value) {const regexForMimeTypes = /image\/png|image\/jpeg|image\/jpg/;return regexForMimeTypes.test(value)};

//________________________________________________________/ uploadImage /_______________________________________________
app.post('/uploadImage', async (req, res) => {
    try {
        const image = req.files;
        console.log("image", image);
        const candidate_ref_no = req.body.candidate_ref_no;

        if (!image || image.length == 0) {return res.status(400).send({ status: false, message: "No image found please provide" });}
        if (!candidate_ref_no || candidate_ref_no.length == 0) {return res.status(400).send({ status: false, message: "No candidate_ref_no found please provide" });}

        if (!isValidImageType(image[0].mimetype)) {return res.status(400).send({ status: false, message: "Only images can be uploaded (jpeg/jpg/png)" })}

        const fileName = `${candidate_ref_no}`; 
        console.log("fileName",fileName)

        const uploadedProfilePictureUrl = await uploadFile(image[0], candidate_ref_no);
        console.log("uploadedProfilePictureUrl", uploadedProfilePictureUrl)
       
        await db('ptr_candidates').where('candidate_ref_no', candidate_ref_no).update({'candidate_resume':fileName })//update table column
        .then((resp) => {return res.status(201) .send({ status: true, message: "successfully inserted" });})
        .catch((error) => {return res.status(500).send({ error: error.message });});
      
    } catch (error) {res.status(500).send({ error: error.message });}
});

//_________________________________________________/ getSingle /________________________________________________________________________________
  app.get('/getSingle', async (req, res) => {
    try {
      const candidate_ref_no = req.body.candidate_ref_no;
      if (!candidate_ref_no || candidate_ref_no.length == 0) {return res.status(400).send({ status: false, message: "No candidate_ref_no found please provide" });}

      const url = await download(candidate_ref_no);
      if(url.length==0){return res.status(400).send({message:"candidate_ref_no not found"})}
      else{
        console.log("candidate_ref_no =>> ",candidate_ref_no)
        res.status(200).send({status: true,message: "single url",data:url});
      }

    } catch (error) {res.status(500).send({ error: error.message });}
  });


app.listen(process.env.PORT || 3000 , function () {
  console.log('Express app running on port' + (process.env.PORT || 3000 ))
})