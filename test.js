var fs = require('fs'),
    request = require('request');

var uri = 'http://humix-omega-think.mybluemix.net/picture';
fs.readFile('./Ironman2.png', function(err, data) {
    if (err) { return console.log(err); }
    var image = new Buffer(data).toString('base64'),
        options = {
            uri: uri,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: image
            })
        };
    request.post(options, function(err, res, body) {
        if (err) { return console.log(err); }
        console.log('body: '+body);
    });
});
