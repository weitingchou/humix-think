var fs = require('fs'),
    request = require('request');

fs.readFile('./Ironman.jpg', function(err, data) {
    if (err) { return console.log(err); }
    var image = new Buffer(data).toString('base64'),
        options = {
            uri: 'http://humix-think.mybluemix.net/face',
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
