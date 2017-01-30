var express =   require("express");
var multer  =   require('multer');
var app  =  express();
var name = " "
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    name = file.fieldname + '-' + Date.now()+'.csv';
    callback(null, name);
  }
});
var upload = multer({ storage : storage}).single('uploaded_file');

app.get('/',function(req,res){
      res.sendFile(__dirname + "/index.html");
});

var api_key = 'key-3ccf93e5d229b6025fbb020d338e5c4d';
var domain = 'aisusc.org';

var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

var server = app.listen(3000,function(){
    console.log("Working on port 3000");
});

app.post('/file-upload',function(req,res){
    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }
        res.end("File is uploaded");
        var fs = require('fs');

        var Converter = require("csvtojson").Converter;
		var converter = new Converter({});
 		
 		//read from file 
		require("fs").createReadStream(req.file.path).pipe(converter);

		//end_parsed will be emitted once parsing finished 
		converter.on("end_parsed", function (jsonArray) {

			var list = mailgun.lists('members@aisusc.org');
			list.members().add({ members: jsonArray, subscribed: true }, function (err, body) {
			});

			var data = "";
			
			if("promocode" in jsonArray[0]){
				data = wPromocode(jsonArray);
			}
			else
				data = woPromocode(jsonArray);
			
			data.text = data.text + '\n'+ req.body.msg;
			
			mailgun.messages().send(data, function (error, body) {
			  console.log(body);
			});
		});
    });
});

function woPromocode(jsonArray){

	var data = {
		from: 'AIS USC<india@aisusc.org>',
		to: 'members@aisusc.org',
		subject: 'Hello',
		text : 'Hi %recipient_name% ',
		};
	return data;

}

function wPromocode(jsonArray){
	var recipientVars = {}
	var attrName = ""
	var attrValue = ""
	for (var i = 0; i < jsonArray.length; i++){
    	var obj = jsonArray[i];
    	for (var key in obj){
    		if(key == 'address'){
    			var attrName = obj[key];
    		}
    		if(key == 'promocode'){
    			var attrValue = obj[key];
    		}
    		if(attrName != "" && attrValue != ""){
    			recipientVars[attrName] = {};
    			recipientVars[attrName]["promocode"] = attrValue;
    		}
    	}
	} 
	
	var data = {
		from: 'AIS USC<india@aisusc.org>',
		to: 'members@aisusc.org',
		subject: 'Hello',
		'recipient-variables': recipientVars,
		text : 'Hi %recipient_name% your promocode: %recipient.promocode% ',
	};
	return data;
}



