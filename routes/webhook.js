var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {		
	res.send("OK !!!")
});


router.post('/', function(req, res, next) {
  //console.log(JSON.stringify(req, null, 2));
  if (req.body.result && req.body.result.parameters  ){
    console.log(" Webhook come wiht : " + JSON.stringify(req.body.result.parameters) )
  }

  res.json({
    "fulfillmentText": "This is a text response",
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
      },
      "facebook": {
        "text": "Hello, Facebook!"
      },
      "slack": {
        "text": "This is a text response for Slack."
      }
    },
    "outputContexts": [
      {
        "name": "projects/2/agent/sessions/2/contexts/context name",
        "lifespanCount": 5,
        "parameters": {
          "param": "param value"
        }
      }
    ],
    "followupEventInput": {
      "name": "event name",
      "languageCode": "en-US",
      "parameters": {
        "param": "param value"
      }
    }
  });   
});


module.exports = router;
