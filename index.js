
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const AWS = require("./aws");

const app = express();
app.use(bodyParser.json());
app.use(multer().any());

const knex = require("knex");

const db = knex({client: "mysql",connection: {host: "localhost",user: "root",database: "attendance_dev", password: ""}});

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

        const uploadedProfilePictureUrl = await AWS.uploadFile(image[0], candidate_ref_no);
        console.log("uploadedProfilePictureUrl", uploadedProfilePictureUrl)
       
        await db('ptr_candidates').where('candidate_ref_no', candidate_ref_no).update({'candidate_resume':fileName })//update table column
        .then((resp) => {return res.status(201) .send({ status: true, message: "successfully inserted" });})
        .catch((error) => {return res.status(500).send({ error: error.message });});
      
    } catch (error) {res.status(500).send({ error: error.message });}
});

//_________________________/ getSingle /________________________________________________
  app.get('/getSingle', async (req, res) => {
    try {
      const candidate_ref_no = req.body.candidate_ref_no;
     
      const url = await AWS.download(candidate_ref_no);
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



// //_________________________________________________________________
// app.get('/getAllImages', async (req, res) => {
//   try {
//     const images = await AWS.getAllImages();
   
//    console.log("images =>> ",images)
//    res
// .status(200)
// .send({status: true,message: "all urls",data:images});

//   } catch (error) {
//     res.status(500).send({ error: error.message });
//   }
// });