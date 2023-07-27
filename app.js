const express = require('express');

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const path = require("path");

const bodyParser = require("body-parser");

const multer = require("multer");

const cors = require("cors");

const app = express();

const fileStorge = multer.diskStorage({
    destination : (req , file , cb) => {
        cb(null , "images");
    },
    filename : (req , file , cb) => {
        cb(null , Date.now().toString() + "-" + file.originalname);
    }
});

const fileFilter = (req , file , cb) => {
    if(file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg"){
        cb(null , true);
    }
    else {
        cb(null , false);
    }
}
const mongoose = require("mongoose");
const MONGODB_URI = 'mongodb+srv://mayank:mayanksharma@cluster0.xpmtenf.mongodb.net/messages?retryWrites=true&w=majority';
app.use(bodyParser.json());

app.use(multer({
    storage : fileStorge,
    fileFilter : fileFilter
}).single('image'));
// GET /feed/posts
app.use("/images" , express.static(path.join(__dirname ,  'images')));


app.use(cors());
// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", " * ");
//     res.setHeader("Access-Control-Allow-Methods", "GET , POST , PUT , PATCH , DELETE");
//     res.setHeader("Access-Control-Allow-Headers", "Content-Type , Authorization");
//     next();
// });
app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);


app.use((error , req , res , next) => {
    console.log(error);
    const status = error.statusCode;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message : message , data : data});
})
mongoose.connect(MONGODB_URI)
    .then(res => {
        app.listen(process.env.POST || 3000);
    })
    .catch(err => {
        console.log(err);
    })