const express = require("express");
const app = express();
const http = require("http").createServer(app);

// [other modules]
const compressImages = require("compress-images");
const formidable = require("express-formidable");
const mysql =require('mysql');
app.use(formidable());

const fileSystem = require("fs");
app.set("view engine", "ejs");
app.use(express.static("uploads"));

const port = process.env.PORT || 3000;

let filePath = "";
let compressedFilePath = "";


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'nodemysqlfs'
  });

http.listen(port, () => {
    console.log("Server started running at port: " + port);

    // [post route goes here]
    // upload image
    app.post("/compressImage", (req, res) =>{
        const image = req.files.image;
        
        if(image.size > 0) {

            if(image.type == "image/png" || image.type == "image/jpeg") {
                fileSystem.readFile(image.path, function (error, data) {
                    if (error) throw error;

                     filePath = "uploads/" + (new Date().getTime()) + "-" + image.name;
                     compressedFilePath = "uploads/" + image.name;
                    const compression = 60;

                    fileSystem.writeFile(filePath, data, async function (error){
                        if (error) throw error;

                        handleimg(filePath, compressedFilePath, compression, image);

                            
                            

                           
                            res.render("success.ejs", {
                                rpath: filePath
                            })
                        })


                    

                        // remove temp file in document/user
                        /*fileSystem.unlink(image.path, function (error) {
                            if (error) throw error;
                        }) */

                        
                    })
                } else {
                    res.send("Please select an image");
                }
            } else {
                res.send("Please select an image");
            }
        })
    // [get route goes here]
    app.get("/", (req, res) => {
        res.render("index.ejs");
    })
})

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // compress the image
async function pressimg(filePath, compressedFilePath, compression) {
    let result;
    compressImages(filePath, compressedFilePath, {
        compress_force: false, statistic: true,
        autoupdate: true }, false,
        {jpg: {engine: "mozjpeg", command: ["-quality", compression]}},
        {png: {engine: "pngquant", command: ["--quality=" + compression + "-" + compression, "-o" ]}},
        {svg: {engine: "svgo", command: "--multipass" }},
        {gif: {engine: "gifsicle", command: ["--colors", "64", "--use-col=web"]}},
          function (error, completed, statistic) {
            console.log("---------------------------");
            console.log(error);
            console.log(completed);
            console.log(statistic);
            result = statistic;
            console.log("----------------------------");
            
            /*fileSystem.unlink(filePath, function (error) {
                if(error) throw error;
            })*/
            
        })
        await delay(3000);
        console.log(result + ' line 110');
        return result;
}
// upload to mysql 
function uploaddb(image, result) {
    db.connect((err) => {
        if (err) throw err;
        console.log('Connected to MySQL database');
        let sql = `UPDATE images SET path = '${image.path}', picExt = '${result.algorithm}', quality = ${result.percent}, backUpOrg = 1, backUpOrgPath = '${result.input}', createThumbnail = true, thumbnailPath = '${result.path_out_new}' WHERE id = 1`;
        db.query(sql, function (err, result) {
            if (err) throw err;
            console.log(result.affectedRows + " record(s) updated");
          });
      });
}

async function handleimg(filePath, compressedFilePath, compression, image) {
    try {

    let resultf = await pressimg(filePath, compressedFilePath, compression);
    console.log(resultf + 'line 130');
    uploaddb(image, resultf);
    } catch (err) {
        console.log(err);
    }
}
