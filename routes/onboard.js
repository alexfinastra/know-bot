var express = require('express');
var router = express.Router();
var fs = require('fs');

router.get('/', function(req, res, next) {
	res.send("OK !!!")   	
});

router.post('/', function(req, res, next) {
  res.json({
                    speech: "Hi",
                    displayText: "Nice to see you :)",
                    source: 'webhook'
            });   
});

router.get('/add/:source', function(req, res, next){
  var data = {};
  readFiles('public/docs/', function(filename, content) {    
    console.log("File name " + filename);
    data[filename] = content;
  }, function(err) {
    throw err;
  });

  res.send("OKey")
})


module.exports = router;


function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      fs.readFile(dirname + filename, 'utf-8', function(err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content);
      });
    });
  });
}