var express = require('express');
var router = express.Router();
var BUSINESSGUIDES_COLLECTION = "businessguides";
var USERS_COLLECTION = "users";
var session_store;
var nodemailer = require('nodemailer');

/* GET home page. */
router.get('/', function(req, res) {		
	res.send("OK !!!")
});

router.post('/', function(req, res, next) {
  console.log("******************************");
  console.log("webhook request :" + JSON.stringify(req.body.queryResult));
  console.log("try :" + JSON.stringify(req.session));
  switch (req.body.queryResult["intent"]["displayName"]){
    case "New Office":
      sendScriptsByMail(req.body.queryResult.parameters, res)
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
        "fulfillmentText": "test Text",
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

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'finastra.integration.team@gmail.com',
    pass: 'koza2012'
  }
});

function sendScriptsByMail(opts, res){
  var mailOptions = {
    from: 'finastra.integration.team@gmail.com',
    to: "zaza.tsivion@finastra.com",
    subject: 'New Office - script',
    text: "Hi, Zaza !\n Please find below the script for new office creation. \n\nINSERT INTO BANKS (OFFICE,UPDATE_DATE,TIME,OPERATOR,OFFC_NAME,OFFC_ADDR1,OFFC_ADDR2,BSNESSDATE,REL_ORDER,FPRINT,TIME_STAMP,CURRENCY,COUNTRYCODE,CALNAME,ACCOUNTNO,MIN_ACC_LENGTH,MAX_ACC_LENGTH,HEDGE_CURRENCY,CUST_CODE,REC_STATUS,LEGAL_ENTITY,MIN_FEE_TRANS_AMOUNT,FEE_CURRENCY,PROFILE_CHANGE_STATUS,PENDING_ACTION,PROCESSING_STATUS,EFFECTIVE_DATE,REFERENCEBRANCH,FORCE_LEAD_ZERO,TRUNC_LEAD_ZERO,OTHER_BASE_CCY,NEXT_BSNESSDATE,PREV_BSNESSDATE,UID_BANKS,CUTOFF_NAME,HISTORY_PROC_DT,LANG,DEF_BOOKNG_ENT,DEF_CNSLD_FEE_POST,DEF_CNSLD_PNL_POST,POST_ZERO_FEE,BTCH_CTRL_ID,DEF_CNSLD_TAX_POST,DEF_CNSLD_TAX_PNL_POST,ISO_CODE_LOGICAL_FIELD,IN_SCOPE_IND,FILE_DUPLICATE_CHECK_IND,MIN_NUM_OF_AUTHORIZ_SUBSCRIBER,LIMIT_CCY,RFF_DUPLICATE_CHECK_IND,ESTM_DUPLICATE_CHECK_IND,ORDER_TYPE,FORMAT_NAME,STATEMENT_DUPLICATE_CHECK_IND,STATEMENT_FORMAT_NAME) VALUES ('"+ opts["NewOfficeName"] +"',null,null,null,'"+ opts["NewOfficeName"] +" Office',null,null,to_date('14-NOV-16','DD-MON-RR'),null,null,'2016-11-14 09:36:00.666','"+ opts["CaseCurrency"] +"','"+ opts["OfficeCountry"] +"','"+ opts["CaseCurrency"] +"',null,'9 ','34',null,'"+ opts["BankIdentifier"] +"','AC',null,null,null,'NO','UP',null,to_date('14-NOV-16','DD-MON-RR'),null,0,0,null,to_date('15-NOV-16','DD-MON-RR'),to_date('14-NOV-16','DD-MON-RR'),'"+ opts["NewOfficeName"] +"',null,to_date('11-NOV-16','DD-MON-RR'),'ENGLISH',null,null,null,0,null,null,null,null,1,1,null,'"+ opts["CaseCurrency"] +"',null,null,null,null,null,null)"
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
       res.json({
          "fulfillmentText": "Sorry , but the supplied data is incorrect please repat the procedure."
        }); 
    } else {
      console.log('Email sent: ' + info.response);
       res.json({
          "fulfillmentText": "Office script was successfully created and send to your email. :)"
        }); 
    }
  });
}