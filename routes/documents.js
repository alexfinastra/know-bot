var express = require('express');
var router = express.Router();
var fs = require('fs');
var pdf = require('pdf-parse');
var BUSINESSGUIDES_COLLECTION = "businessguides";
var DELIMITER = "~";

router.get('/', function(req, res, next) {
	res.redirect('/documents/add/docs'); 	
});

router.get('/:name', function(req, res, next){ 
  filename = 'GPP Business Guide ' + req.params.name + '.pdf' ;    
  let dataBuffer = fs.readFileSync('public/docs/' + filename);
  pdf(dataBuffer).then(function(data) { 
    console.log("************************************************************************************")    
    split2documents(filename, data, function(docs){
      res.json(docs);
    });
  });
})

router.get('/add/:source', function(req, res, next){ 
  readFiles('public/docs/', function(documents) {    
    // store or update documents in mongodb
    if(documents.length > 0){      
      documents.forEach(function(dct){
        db.collection(BUSINESSGUIDES_COLLECTION).insertOne(dct, function(err, doc) {
         if (err) {
            handleError(res, err.message, "Failed to create new docuemnt.");
          } else {
            console.log("New document created " + doc.ops[0] );
          }        
        });
      })
    }
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
      //if(filename.indexOf("Currency Conversion") > -1) {
        let dataBuffer = fs.readFileSync(dirname + filename);
        pdf(dataBuffer).then(function(data) { 
          console.log("************************************************************************************")
          console.log("Filename ---> " + filename)
          split2documents(filename, data, onFileContent);
        });        
      //} 
    });
  });
}

function verifyWord(item){
  var v_item = item.replace(/\n/g,"").trim();  
  if(v_item.indexOf('..') > -1){
    //console.log("Before v_item ---> " + v_item)
    it = v_item.replace(/\../g,"");
    //console.log("Before it ---> " + it)
    v_item  = (it.length > 0 && it != ".") ? it.replace(".","") : "";
    //console.log("After v_item ---> " + v_item)
  }
  
  if(v_item.length > 0 ){
     return v_item.toLowerCase();
   } else {
     return "";
   }
}

function removeAllButLast(string, token) {
    var parts = string.split(token);
    if (parts[1]===undefined)
        return string;
    else
        return parts.slice(0,-1).join('') + token + parts.slice(-1)
}

function splitText(text){
  var ret;
  var count = (text.match(/table of contents/g) || []).length;
  if(count == 1){
    ret = text.split(' ');
  } else {
    ret = removeAllButLast(text, 'table of contents').split(' ')
  }
  return ret; 
}

function split2documents(filename, data, cb){ 
  var docs = [];
  var words_arr = splitText(data.text.toLowerCase());
  var toc = [['table','of','contents']]; 
  var pages = [];
  var toc_ptrn_ind = 0;
  var toc_word_ind = 0;
  var text_arr = {};
  var pattern_type = "";
  var newEntry = true;  
  
  pages.push(2);
  //console.log(" For "+ filename + " number of words : " + words_arr.length)
  for (var i = 0; i < words_arr.length; i++) {
    var word = verifyWord(words_arr[i]) 
      
    if(word.length > 0){
      //console.log("Pattern " + toc[toc_ptrn_ind] + " ptrn index " + toc_ptrn_ind + " and word index "+toc_word_ind + " word --> " + word)
      if(toc[toc_ptrn_ind] != undefined && word == toc[toc_ptrn_ind][toc_word_ind]){
        //console.log("Pattern match " + word + " with pattern " + toc[toc_ptrn_ind][toc_word_ind])
        toc_word_ind = toc_word_ind + 1        
        pattern_type = ""

        //completed pattern match next item is text
        if(toc[toc_ptrn_ind][toc_word_ind] == undefined){          
          pattern_type = toc[toc_ptrn_ind].join(' ');          
          toc_ptrn_ind = toc_ptrn_ind + 1;
          toc_word_ind = 0;
          //console.log("Pattern found --> " + pattern_type + " next WORDS "+ words_arr.slice(i+1, i+30));          
        }
      } else {
        if(toc_word_ind > 0){ 
            if(docs.length > 0){
              docs[docs.length-1]["context"] = docs[docs.length-1]["context"].concat(toc[toc_ptrn_ind].slice(0, toc_word_ind))
            }
            toc_word_ind = 0; 
            pattern_type = toc[toc_ptrn_ind].join(' ');
            //console.log("Reset index as not inline with pattern ->"+pattern_type);
        } else {
          if(pattern_type.length > 0){
            if(pattern_type == 'table of contents'){              
              var isNumber = /^\d+$/.test(word);
              //console.log("Word " + word + " newEntry " + newEntry + " and isNumber " + isNumber + " pattern_type "+pattern_type)
              if(!isNumber) {                
                if(newEntry){
                  if ((word.indexOf('appendix') == -1) && (word.indexOf('.') == -1)){                  
                    pattern_type = "";
                  } else {
                    toc.push([]);
                    toc[toc.length-1].push(word)
                    newEntry = false  
                  }
                } else {
                  toc[toc.length-1].push(word)  
                }
              } else{
                if(newEntry){
                  toc.push([]);
                  toc[toc.length-1].push(word)
                  newEntry = false
                } else {
                  //console.log("************************************************************************************")   
                  //console.log(" before ",toc[toc.length-1].join(" ") ,"  Number not a new entry -> ", word, " and ", JSON.stringify(pages));
                  pages.push(String(word));
                  //console.log(" after ",toc[toc.length-1].join(" ") ,"  Number not a new entry -> ", word, " and ", JSON.stringify(pages));
                  //console.log("************************************************************************************")   
                  newEntry = true
                }  
              }
            } else{
              //console.log("Pattern -->" +pattern_type + " collect word : " + word )              
              last_section = docs.length > 0 ? docs[docs.length-1]["section"] : "NO_SECTION";
              if(pattern_type.indexOf(last_section) == -1){                                
                var scope = filename.split('.')[0].replace("GPP", "").replace("Business", "").replace("Guide", "").trim();
                var section = toc[toc_ptrn_ind-1].slice(1,toc[toc_ptrn_ind-1].length).join(' ');               
                var searchind = "Business Guide"+ DELIMITER + scope + DELIMITER + section;
                var page = parseInt(pages[toc_ptrn_ind-1]) + parseInt(pages[0]);
                //console.log(" pattern_type:"+ pattern_type+ " scope:"+ scope+"section :"+ section+"searchind: "+ searchind+" page :"+ page);
                docs.push({
                  "searchind": searchind.toLowerCase() , 
                  "intent": null, 
                  "questions": [], 
                  "parameters": null, 
                  "answer": "",
                  "source": "GPP Business Guide".toLowerCase(),
                  "scope":  scope.toLowerCase(),
                  "section": section.toLowerCase(),
                  "context": [],
                  "url": "https://know-robot.herokuapp.com/docs/" + filename + "#page=" + page
                })
              } 

              docs[docs.length-1]["context"].push(word);
            }
          }
        }
      }
    }  
  }
  console.log("File name " +filename+ " collected text " + JSON.stringify(toc) + " number of sections: " + docs.length);
  cb(docs);
}

String.prototype.capitalize = function() {
  str_arr = this.split(" ")
  res = []
  str_arr.forEach(function(str){
    if(str.trim().toLowerCase().indexOf("and") > -1 && str.trim().length == 3){
      res.push("and")
    }else{
      res.push( (str.charAt(0).toUpperCase() + str.toLowerCase().slice(1)) )
    }
  })
  return res.join(" ");
}


