var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {		
	res.send("OK !!!")
});


router.post('/', function(req, res, next) {
  console.log("try :" + JSON.stringify(req.body.queryResult.parameters));
  
  res.json({
    "fulfillmentText": "Thak you for your call",
    "fulfillmentMessages": [
      {
        "card": {
          "title": "card title",
          "subtitle": "card text",
          "imageUri": "https://assistant.google.com/static/images/molecule/Molecule-Formation-stop.png",
          "buttons": [
            {
              "text": "button text",
              "postback": "https://assistant.google.com/"
            }
          ]
        }
      }
    ],
    "source": "example.com",
    "payload": {
      "google": {
        "expectUserResponse": true,
        "richResponse": {
          "items": [
            {
              "simpleResponse": {
                "textToSpeech": "this is a simple response"
              }
            }
          ]
        }
      }
    }
  });   
});


module.exports = router;
