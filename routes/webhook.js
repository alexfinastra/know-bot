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
    case "What Is":
      replyWithDefinition(req.body.queryResult.parameters, res)
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
    res.json({
      "fulfillmentText": "Heres the next question for you dummy!"
    });
      break;

    case "Next Question - yes":    
    let correct = checkifCorrect(answer);
    if (correct) {
    res.json({
        "fulfillmentText": "Correct Answer!"
      });

    } else {
      res.json({
        "fulfillmentText": "You are wrong, dummy! the correct answer is:"
      });
    }
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

function replyWithDefinition(opts, res){
  var def = ""
  switch (opts["WhatIsTopic"].toLowerCase()) {
    case "base currency":
      def = "The currency in which the bank maintains its accounts and the first currency quoted in a currency pair. It is typically the local currency.";
      break;
    case "bank identifier":
      def = "ISO 9362 (also known as BIC code or SWIFT code) is a standard format of Bank Identifier Codes approved by the International Organization for Standardization. It is the unique identification code of a particular bank";
      break;
    case "suspense account":
      def = "Specifies the account to which the money willbe moved for the temprorary time, aka washing account";
      break;
    case "settlement account":
      def = "Select the Settlement Account that the local bank uses at the MOP for payments exchanged with this MOP";
      break;
    case "membership id":
      def = "Member ID for the MOP selected from the Parties Data Search window. After selection, value of BIC/BEI, ABA or CP ID, is shown based on the Member Type.";
      break;
    default: 
      def = "Sorry, for my incompetentce. Will speack with my master. Wait a while and the answer will be on your way."
      break;
  }

  res.json({
          "fulfillmentText": def
        });
 
}
function checkifCorrect (answer) {
  return true;
}