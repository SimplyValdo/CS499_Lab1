var express = require('express');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var app = express();
var path = require('path');
var fs = require('fs');

AWS.config.update({region:'us-west-1'});
app.use(express.static(__dirname + '/'));

var myBucket = 'cs499-hackathon1';

app.get('/', function (req, res) {
    res.sendfile('./index.html')
})

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.listen(3888, function () {
    console.log('Example app listening on port 3888!')
})

fs.watch('./storage', function (event, filename) {

    console.log('Event is: ' + event);

    if (filename)
    {
        console.log('filename provided: ' + filename);

        //when a file is added or removed
        if (event == 'rename')
        {
            fs.stat('./storage/' + filename, function (err, stats)
            {
                if (!err)
                {
                    //When file is added
                    console.log('File added');
                    uploadFileToS3('./storage/' + filename, filename);
                }
                else
                {
                    //File name is removed
                    console.log('File deleted');
                    deleteFileFromS3('./storage/' + filename, filename)
                }
            });
        }
        else
        {
            // file is changed
            uploadFileToS3('./storage/' + filename, filename);
            console.log('filename updated');
        }
    }
    else
    {
        console.log('filename not provided: ', err.code);
    }
});

app.get('/list', function(req, res){
    var params = {Bucket: myBucket};
    s3.listObjects(params, 	function(err, data){
        for(var i = 0; i < data.Contents.length; i++) {
            data.Contents[i].Url = 'https://s3-us-west-1.amazonaws.com/' + data.Name + '/' + data.Contents[i].Key;
            console.log(JSON.stringify(data));
        }
        res.send(data.Contents);
    })
})

function uploadFileToS3(FilePath, FileName) {
    fs.readFile(FilePath, function (err, data) {
        params = {Bucket: myBucket, Key: FileName, Body: data, ACL: "public-read", ContentType: "application/pdf"};
        s3.putObject(params, function (err, data) {
            if (err) {
                console.log(err)
            }
            else {
                console.log("Successfully uploaded data to " + myBucket, data);
            }
        });
    });
}

function deleteFileFromS3(FilePath, FileName) {
    fs.readFile(FilePath, function (err, data) {
        params = {Bucket: myBucket, Key: FileName};
        s3.deleteObject(params, function(err, data) {
            if(err) {
                console.log(err);
            }
            else {
                console.log("Successfully deleted data from " + myBucket, data);
            }
        });
    });

}