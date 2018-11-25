var express = require('express');
var router = express.Router();
var BUSINESSGUIDES_COLLECTION = "businessguides";
var USERS_COLLECTION = "users";
var session_store;

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
      text =  (session_store.correct_answer == "yes") ? "The answer is correct." : "You are missed."
      res.json({
        "fulfillmentText": text
      });
      break;
    case "Business Guide - no":
      text =  (session_store.correct_answer == "yes") ? "The answer is correct." : "You are missed."
      res.json({
        "fulfillmentText": text
      });
      break;
    case "GetEmail":
      session_store.email = req.body.queryResult.parameters.email;
      getUser(session_store["email"], function(user){
        res.json({
          "fulfillmentText": "Thank you."
        });
      })
      break;
    case "Next Question":
      //text =  (session_store.correct_answer == "no") ? "The answer is correct." : "You are missed."
      res.json({
        "fulfillmentText": text,
        "followupEventInput": {
          "name": "success_event",
          "parameters": {          
          },
          "languageCode": "en-US"
        }
      });
      break;
  }    
});


module.exports = router;

function buildQuestion(cb){
   db.collection(BUSINESSGUIDES_COLLECTION).find({}).toArray(function(err, result) {
    if (err) throw err;
    var limit = result.length-1;
    qoutes=[];
    var doc;
    while(qoutes.length == 0){
      doc = result[Math.floor(Math.random() * (limit))]
      qoutes = doc.content.filter(function(p){return p.indexOf(doc.section) > -1 })
    }
    random_scope = result[Math.floor(Math.random() * (limit))].scope;
    session_store.correct_answer = doc.scope == random_scope ? "yes" : "no";
    q = "Does the qoute " + qoutes[0] + " is taken from " + random_scope + " business guide?"
    cb(q)
  });
}

function getUser(email, cb){
  console.log("Users email is " + email);
  db.collection(USERS_COLLECTION).findOne({ "email": email }, function(err, doc) {
    console.log("Check if user exists :" + err + " result :" + JSON.stringify(doc));
    if (err == null) {
      cb(doc);
    } else {
      return null;
    }
  });
}