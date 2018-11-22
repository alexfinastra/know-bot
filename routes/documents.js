var express = require('express');
var router = express.Router();
var fs = require('fs');
var pdf = require('pdf-parse');

router.get('/', function(req, res, next) {
	res.send("OK !!!")   	
});


router.get('/add/:source', function(req, res, next){ 
  readFiles(db, 'public/docs/', function(db, filename, documents) {    
    // store or update documents in mongodb
    if(documents.length > 0){
      documents.forEach(function(dct){
        //db.collection("businessguides").insertOne(dct, function(err, doc) {
        //  if (err) {
        //    handleError(res, err.message, "Failed to create new docuemnt.");
        //  } else {
        //    console.log("New document created " + doc.ops[0] );
        //  }
        //fs.writeFileSync(appRoot + "documents.json", JSON.stringify(dct) , ['utf-8','as+']);
        
        //});
      })
    }
  }, function(err) {
    throw err;
  });

  res.send("OKey")
})


module.exports = router;


function readFiles(db, dirname, onFileContent, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {     
      let dataBuffer = fs.readFileSync(dirname + filename);
      pdf(dataBuffer).then(function(data) { 
          var documents = split2documents(filename, data);
          onFileContent(db, filename, documents);
      });
    });
  });
}


function split2documents(filename, data){ 
  var docs = []
  //get table of content
  remained_arr = data.text.split("Table of Contents")
  remained = remained_arr[remained_arr.length -1];  

  // split to separate items for next parse
  toc_items = remained.split('\n').filter(function(p){return p.indexOf('.......') > -1 });
  len = toc_items.length;

  // get the first section namd and cunt untill it
  first_section = toc_items[0].split('.......')[0];
  if((/[a-z]/.test(first_section)) == false){ first_section = first_section.capitalize() };
  remained_arr = remained.split(first_section);
  remained = remained_arr[remained_arr.length-1];

  console.log("\n\n\n************************************************")
  console.log("Filename  : " + filename); 
  
  // go in loop and cut with next item , cutting part save 
  for(var i=0; i<len; i++){    
    section = toc_items[i].split('.......')[0];
    if((/[a-z]/.test(section)) == false){ section = section.capitalize() }

    if(toc_items[i+1] == undefined){
      content = remained
    } else {
      if ( remained != undefined){
            next = toc_items[i+1].split('.......')[0];      
            if((/[a-z]/.test(next)) == false){ next = next.capitalize() }
            content = remained.split(next)[0];
            remained = remained.split(next)[1];    
          }
    }

    if(content != undefined){
      console.log("\n-----------------------------------------")
      console.log("Section : " + section);
      //console.log("Content : " + content);
      //console.log("-----------------------------------------")
      docs.push({
        "filename": filename,
        "numpages": data.numpages,
        "info": data.info,
        "metadata": data.metadata,
        "version": data.version,
        "section" : section,
        "content" : content
      });    
    }
  }
  console.log("************************************************\n\n\n")
  return docs;
 }

String.prototype.capitalize = function() {
  str_arr = this.split(" ")
  res = []
  str_arr.forEach(function(str){
    if(str.toLowerCase().indexOf("and") > -1){
      res.push("and")
    }else{
      res.push( (str.charAt(0).toUpperCase() + str.toLowerCase().slice(1)) )
    }
  })
  return res.join(" ");
}