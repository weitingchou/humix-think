/**
 * Copyright 2013,2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var request = require('request');

module.exports = function (RED) {
    var cfenv = require('cfenv');

    var services = cfenv.getAppEnv().services,
        service = null;

    if (services['user-provided']) { service = services['user-provided'][0]; }

    RED.httpAdmin.get('/watson-alchemy-face-detection/vcap', function (req, res) {
        res.json(service);
    });

    function FaceDetectNode (config) {
        RED.nodes.createNode(this, config);
        var node = this;

        if (!service) {
            node.error('No question and answer service bound');
        } else {

            this.on('input', function (msg) {
                if (!msg.payload) {
                    node.error('Missing property: msg.payload');
                    return;
                }

                var image = msg.payload.image || undefined,
                    params = {},
                    urlKVPairs = [];

                if (!image) {
                    node.error('Invalid request format! No property "image" found.');
                    return;
                }

                params['apikey'] = service.credentials.apikey;
                params['outputMode'] = 'json';
                params['imagePostMode'] = 'raw';
                Object.keys(params).forEach(function(key) {
                    urlKVPairs.push(key+'='+encodeURIComponent(params[key]));
                });

                image = new Buffer(image, 'base64');
                var options = {
                    uri: service.credentials.url+'/calls/image/ImageGetRankedImageFaceTags?'+urlKVPairs.join('&'),
                    headers: { 'Content-Length': image.length },
                    body: image
                };

                request.post(options, function (err, res, body) {
                    if (err) { node.error('API responses with error: ' + err.msg); }
                    else {
                        try {
                            msg.payload = JSON.parse(body);
                            node.send(msg);
                        } catch (e) {
                            node.error('API responses with error: ' + e);
                        }
                    }
                });
            });
        }
    }
    RED.nodes.registerType('watson-alchemy-face-detection', FaceDetectNode);
};
