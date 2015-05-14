var uuid = require('node-uuid'),
    request = require('request'),
    appEnv = require('cfenv').getAppEnv();

module.exports = function(RED) {

    function FacebookMessageInNode(config) {
        RED.nodes.createNode(this, config);
        var node = this,
            conNodeId = uuid.v4(),
            feedNodeId = uuid.v4(),
            conOptions = {
                url: 'http://humix-fb.mybluemix.net/api/conversations',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    page_id: config.pageId,
                    access_token: config.accessToken,
                    notifyUrl: 'http://'+appEnv.app.application_name+'.mybluemix.net/'+conNodeId
                })
            };
            feedOptions = {
                url: 'http://humix-fb.mybluemix.net/api/feeds',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    page_id: config.pageId,
                    access_token: config.accessToken,
                    notifyUrl: 'http://'+appEnv.app.application_name+'.mybluemix.net/'+feedNodeId
                })
            };
        console.log('conOptions: '+JSON.stringify(conOptions));
        console.log('feedOptions: '+JSON.stringify(feedOptions));

        function handleMessage(req, res) {
            console.log('received message: '+JSON.stringify(req.body.message));
            node.send({
                facebook: {
                    sender: req.body.sender || undefined,
                    messageId: req.body.msg_id || undefined,
                    conversationId: req.body.t_id || undefined,
                    type: req.body.type || undefined,
                    pageName: req.body.page_name || undefined,
                    accessToken: config.accessToken
                },
                payload: req.body.message || ''
            });
            res.send('Ok');
        }

        request.post(conOptions, function(err, response) {
            if (err) { return node.error('Unable to connect to server, ERRMSG: '+err); }
            else if (response.statusCode !== 200) {
                return node.error('Failed to register conversation endpoint.');
            }
            console.log('registerd');
            RED.httpAdmin.post('/'+conNodeId, handleMessage);
        });
        request.post(feedOptions, function(err, response) {
            if (err) { return node.error('Unable to connect to server, ERRMSG: '+err); }
            else if (response.statusCode !== 200) {
                return node.error('Failed to register feed endpoint.');
            }
            console.log('registerd');
            RED.httpAdmin.post('/'+feedNodeId, handleMessage);
        });
    }

    RED.nodes.registerType('facebook message in', FacebookMessageInNode);

    function FacebookMessageOutNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg) {
            if (!msg.payload || !msg.facebook || !msg.facebook.messageId) {
                node.error('Missing property!');
                return;
            }

            var options = {
                url: 'http://humix-fb.mybluemix.net/api/message',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    t_id: msg.facebook.conversationId,
                    access_token: msg.facebook.accessToken,
                    type: msg.facebook.type,
                    page_name: msg.facebook.pageName,
                    message: msg.payload.text || ''
                })
            };
            console.log('options: '+JSON.stringify(options));
            request.post(options, function(err) {
                if (err) { node.error('Failed to send message, err: '+err); }
            });
        });
    }

    RED.nodes.registerType('facebook message out', FacebookMessageOutNode);
};
