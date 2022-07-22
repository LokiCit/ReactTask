const express = require("express");
const app = express();
const mongoose = require("mongoose");
const multer = require("multer");
const Grid = require('gridfs-stream');
const {
  GridFsStorage
} = require("multer-gridfs-storage");
const logger = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');

require("dotenv")
  .config();

const mongouri = 'mongodb://localhost:27017/test01';
try {
  mongoose.connect(mongouri, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  });
} catch (error) {
  handleError(error);
}
process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error.message);
});
const conn = mongoose.createConnection(mongouri);

/** Seting up server to accept cross-origin browser requests */
app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST,GET");
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", true);
    next();
  });


  // Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/src/App.js')));
app.use(bodyParser.json());
app.use(logger('dev'));




let gfs;
conn.once('open', function () {
    //init the stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('newBucket');
});

//creating bucket
let bucket;
mongoose.connection.on("connected", () => {
  var client = mongoose.connections[0].client;
  var db = mongoose.connections[0].db;
  bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: "newBucket"
  });
  console.log(bucket);
});

app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

const storage = new GridFsStorage({
  url: mongouri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = file.originalname;
      const fileInfo = {
        filename: filename,
        bucketName: "newBucket"
      };
      resolve(fileInfo);
    });
  }
});

// let filePathToRender = 'index.ejs'
const upload = multer({
  storage
});
app.get('/', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        //check if files exist
        if (!files || files.length === 0) {
            // res.render(filePathToRender, { files: false });
            res.sendFile(path.join(__dirname+'/client/src/App.js'),{files:false});
        }
        else {
            files.map(file => {
                //if the file is an image to display it
                if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
                    file.isImage = true;
                }
                else {
                    file.isImage = false;
                }
            });
            //render index 
            // res.render(filePathToRender, { files: files });
            res.sendFile(path.join(__dirname+'/client/src/App.js'),{files:files});
        }
    });
});
app.get("/files/:filename", (req, res) => {
    console.log('tracker')
  const file = bucket
    .find({
      filename: req.params.filename
    })
    .toArray((err, files) => {
        console.log('bucket>>>>>',res ,"<<<bucket")
      if (!files || files.length === 0) {
        return res.status(404)
          .json({
            err: "no files exist"
          });
      }
      bucket.openDownloadStreamByName(req.params.filename)
        .pipe(res);
    });
});


app.get('/files', (req, res) => {
    gfs.files.find().toArray((err, files) => {
       if(!files || files.length === 0){
          return res.status(404).json({
             message: "Could not find files"
          });
       }
       return res.json(files);
    });
 });


app.post("/files", upload.single("file"), (req, res) => {
//   res.status(200)
//     .send(req.file);

    if (req.file) {
        return res.json({
          success: true,
          file: req.file
        });
      }
      res.send({ success: false });
});

const PORT = process.env.PORT || 3600;
app.listen(PORT, () => {
  console.log(`Application live on localhost:{process.env.PORT}`);
});