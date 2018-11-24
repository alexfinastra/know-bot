var express = require('express');
var router = express.Router();
var BUSINESSGUIDES_COLLECTION = "businessguides";
/* GET home page. */
router.get('/', function(req, res) {		
	res.send("OK !!!")
});

router.post('/', function(req, res, next) {
  console.log("******************************");
  console.log("webhook request :" + JSON.stringify(req.body.queryResult));
  console.log("try :" + JSON.stringify(req.session));
  switch (req.body.queryResult["intent"]["displayName"]){
    case "Business Guide Trivia":
      buildQuestion(function(doc){
        res.json({
          "fulfillmentText": doc
        }); 
      })  
      break;
    case "Business Guide - yes":
      break;
    case "Business Guide - no":
      break;
  }    
});


module.exports = router;

function buildQuestion(cb){
   db.collection(BUSINESSGUIDES_COLLECTION).find({}).toArray(function(err, result) {
    if (err) throw err;
    var limit = result.length-1;
    qoutes=[]
    while(qoutes.length == 0){
      doc = result[Math.floor(Math.random() * (limit))]
      qoutes = doc.content.filter(function(p){return p.indexOf(doc.section) > -1 })
    }
    
    q = "Does the qoute " + qoutes[0] + " is taken from " + result[Math.floor(Math.random() * (limit))].scope + " business guide?"
    cb(q)
  });
}