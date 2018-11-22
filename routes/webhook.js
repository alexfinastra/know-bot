var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {		
	res.send("OK !!!")
});


router.post('/', function(req, res, next) {
  //console.log(JSON.stringify(req, null, 2));
  
  res.json({
    "fulfillmentText": "This is a text response" 
  });   
});


module.exports = router;
