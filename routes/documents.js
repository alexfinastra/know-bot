var express = require('express');
var router = express.Router();
var fs = require('fs');
var pdf = require('pdf-parse');

var BUSINESSGUIDES_COLLECTION = "businessguide";
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

function getSection(section_path_arr){  
  var match_sections = [];
  var result = sections[0]["value"];
  sections.forEach(function(section){
    has_match = section["synonyms"].filter(syn => -1 !== section_path_arr.join(' ').indexOf(syn))
    if(has_match.length > 0){
      result = section["value"]
    }
  })  
  return result
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
  var scope = filename.split('.')[0].replace("GPP", "").replace("Business", "").replace("Guide", "").trim();
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
              var section_path_arr = []; var temp = [];
              var section_number_arr = pattern_type.split(' ')[0].split('.');
              section_number_arr.forEach(function(num){
                temp.push(num)
                sec = toc.filter(sec => sec[0] ==  temp.join('.'))[0];
                if(sec != undefined){ section_path_arr.push(sec.slice(1, sec.length).join(' ')); } 
              }); 
              last_section_path = docs.length > 0 ? docs[docs.length-1]["section_path"] : [];  
              if(arraysEqual(last_section_path, section_path_arr) == false){                
                var page = parseInt(pages[toc_ptrn_ind-1]) + parseInt(pages[0]);
                docs.push({
                  "intent": null, 
                  "questions": [], 
                  "parameters": [], 
                  "answer": "",
                  "source": "GPP Business Guide".toLowerCase(),
                  "scope":  scope.toLowerCase(),
                  "section": getSection(section_path_arr).toLowerCase(),
                  "section_path": section_path_arr,
                  "context": [],
                  "context_url": "https://know-robot.herokuapp.com/docs/" + filename + "#page=" + page
                })
              } 

              docs[docs.length-1]["context"].push(word);
            }
          }
        }
      }
    }  
  }
  //console.log("File name " +filename+ " collected text " + JSON.stringify(toc) + " number of sections: " + docs.length);
  cb(docs);
}

function arraysEqual(arr1, arr2) {
  if(arr1.length !== arr2.length)
    return false;
  for(var i = arr1.length; i--;) {
    if(arr1[i] !== arr2[i])
        return false;
  }

  return true;
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

var sections = [
  {
    "order" : 1,
    "value": "introduction",
    "synonyms": [
      "introduction",
      "target audience",
      "related documents",
      "overview"
    ]
  },{
    "order" : 2,
    "value": "processing",
    "synonyms": [
      "processing",
      "business flow",
      "flow",
      "workflow",
      "workflow details",
      "queue handling",
      "use cases",
      "application features",
      "soa services"
    ]
  },
  {
    "order" : 3,
    "value": "manual handling",
    "synonyms": [
      "manual handling",
      "gui",
      "message actions",
      "user actions",
      "repair statuses",
      "user involvement statuses",
      "web",
      "web ui",
      "web app",
      "user interface",
      "browser"
    ]
  },
  {
    "order" : 4,
    "value": "setup",
    "synonyms": [
      "setup",
      "configuration",
      "system configuration",
      "system options",
      "general setup",
      "recomended setup",
      "user defined queue",
      "system parameter",
      "mapping rules",
      "payment transformation",
      "upload",
      "basic setup"
    ]
  },
  {
    "order" : 5,
    "value": "message data",
    "synonyms": [
      "message data",
      "errors",
      "audittrail",
      "message attributes",
      "message status",
      "mapping",
      "user defined fields"
    ]
  },
  {
    "order" : 6,
    "value": "Inetrfaces",
    "synonyms": [
      "inetrfaces"
    ]
  },
  {
    "order" : 7,
    "value": "business setup",
    "synonyms": [
      "business rules",
      "client rules",
      "business profile",
      "static data",
      "tasks",
      "business setup"
    ]
  },
  {
    "order" : 8,
    "value": "system setup",
    "synonyms": [
      "system rules",
      "system profiles",
      "entitlement"
    ]
  },
  {
    "order" : 9,
    "value": "appendix",
    "synonyms": [
      "appendix",
      "glossary"
    ]
  }
]