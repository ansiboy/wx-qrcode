"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const path = require("path");
const socket_io = require("socket.io");
const messages_1 = require("./messages");
const weixin_1 = require("./weixin");
const url = require("url");
const querystring = require("querystring");
const fs = require("fs");
const sha1 = require("js-sha1");
let console = global.console;
function image(req, res, config) {
    let urlInfo = url.parse(req.url);
    let query = querystring.parse(urlInfo.query);
    let from = query.from;
    if (!from) {
        let err = new Error('Url parameter "from" is required.');
        outputError(res, err);
        return;
    }
    let modelName = query.model;
    if (!modelName) {
        let err = new Error('Url parameter "model" is required.');
        outputError(res, err);
        return;
    }
    let appid = config.appid;
    let arg = query.arg || '';
    let scope = query.scope || 'snsapi_base';
    let baseURL = 'http://wx-openid.bailunmei.com';
    let redirect_uri = encodeURIComponent(`${baseURL}/code?from=${from}&modelName=${modelName}&arg=${arg}`);
    let auth_url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}#wechat_redirect`;
    let qr = require('qr-image');
    let code = qr.image(auth_url, { type: 'png' });
    console.log(`auth url: ${auth_url}`);
    res.setHeader('Content-type', 'image/png');
    code.pipe(res);
}
function code(req, res, config) {
    return __awaiter(this, void 0, void 0, function* () {
        let urlInfo = url.parse(req.url);
        let query = querystring.parse(urlInfo.query);
        let { modelName, code, from, arg } = query;
        if (modelName == null) {
            let err = new Error(`Argument model is required.`);
            outputError(res, err);
            return;
        }
        let model = config.models[modelName];
        if (model == null) {
            console.log(`model ${modelName} is null`);
            res.end(`model ${modelName} is null`);
            return;
        }
        let pathname = path.join(__dirname, 'wx-page.html');
        console.log(`to read file ${pathname}`);
        fs.readFile(pathname, (err, data) => {
            if (err) {
                outputError(res, err);
                return;
            }
            let html = data.toString();
            var vash = require('vash');
            if (!vash) {
                let err = new Error('Can not load vash module.');
                outputError(res, err);
                return;
            }
            var tpl = vash.compile(html);
            let text = model.text;
            var out = tpl({
                title: text.title,
                content: text.content,
                buttonText: text.confirmButton,
                successText: text.success,
                failText: text.fail,
                code,
                masterId: from,
                modelName,
                argument: arg
            });
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.write(out);
            res.end();
        });
    });
}
function jsSignature(req, res, config) {
    return __awaiter(this, void 0, void 0, function* () {
        let urlInfo = url.parse(req.url);
        let query = querystring.parse(urlInfo.query);
        let u = query.url;
        if (!u) {
            let err = new Error(`Argument url is required.`);
            outputError(res, err);
            return;
        }
        let cgi_bin = weixin_1.create_cgi_bin(config.appid, config.secret);
        let noncestr = 'noncestr';
        let timestamp = (Date.now() / 1000).toFixed();
        let t = yield cgi_bin.ticket.getticket('jsapi');
        let str = `jsapi_ticket=${t.ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${u}`;
        console.log({ method: 'jsSignature', encode_string: str });
        let hash = sha1(str);
        res.setHeader('Content-type', 'application/json');
        res.write(JSON.stringify({ signature: hash, appId: config.appid, timestamp, noncestr }));
        res.end();
    });
}
function outputError(response, err) {
    console.log(err);
    const StatusCodeDefaultError = 600;
    response.statusCode = StatusCodeDefaultError;
    response.statusMessage = err.name; // statusMessage 不能为中文，否则会出现 invalid chartset 的异常
    if (/^\d\d\d\s/.test(err.name)) {
        response.statusCode = Number.parseInt(err.name.substr(0, 3));
        err.name = err.name.substr(4);
    }
    let outputObject = { message: err.message, name: err.name, stack: err.stack };
    let str = JSON.stringify(outputObject);
    response.write(str);
    response.end();
}
function run(config, logger) {
    console = logger || console;
    let handler = (req, res) => __awaiter(this, void 0, void 0, function* () {
        let urlInfo = url.parse(req.url);
        switch (urlInfo.pathname) {
            case '/image':
                image(req, res, config);
                return;
            case '/code':
            case '/openid':
                code(req, res, config);
                return;
            case '/jsSignature':
                jsSignature(req, res, config);
                return;
            default:
                let err = new Error(`Unkonw pathname ${urlInfo.pathname}. url ${req.url}`);
                // throw err
                outputError(res, err);
                return;
        }
    });
    let server = http.createServer((req, res) => {
        try {
            handler(req, res);
        }
        catch (err) {
            outputError(res, err);
        }
    });
    let io = socket_io({ path: '/socket.io' });
    io.on('connection', function (socket) {
        let role = socket.handshake.query.role;
        if (!role) {
            raiseError(socket, 'Query parameter "role" is required.');
            return;
        }
        if (role != 'master' && role != 'slave') {
            raiseError(socket, 'Query parameter "role" must be mater or slave.');
            return;
        }
        let masterId = socket.handshake.query.masterId;
        if (role == 'slave' && !masterId) {
            raiseError(socket, 'Query parameter "masterId" is required.');
            return;
        }
        if (role == 'master') {
            console.info('execute processMaster method');
            processMaster(socket);
        }
        else if (role == 'slave') {
            master_slave_ids[masterId] = socket.id;
            console.info('execute processSlave method');
            processSlave(socket, masterId);
        }
    });
    function raiseError(socket, message) {
        console.error(message);
        socket.emit(messages_1.default.exception, { message: message });
    }
    let master_slave_ids = {};
    function processMaster(socket) {
        // socket.on(messages.success, function (args) {
        //     let slave_id = master_slave_ids[socket.id]
        //     console.assert(slave_id)
        //     socket.to(slave_id).emit(messages.success, args)
        // })
    }
    function processSlave(socket, masterId) {
        console.log(`socket.id: ${socket.id}`);
        socket.on(messages_1.default.exit, function ({ to }) {
            if (!to) {
                let err = 'Arugment "to" is missing.';
                console.error(err);
                socket.emit(messages_1.default.exception, { message: err });
                return;
            }
            console.log(`${messages_1.default.exit}`);
        });
        socket.on(messages_1.default.success, function (args) {
            socket.to(masterId).emit(messages_1.default.success, args);
        });
        socket.on(messages_1.default.fail, function (args) {
            socket.to(masterId).emit(messages_1.default.confirm, args);
        });
        socket.on(messages_1.default.confirm, function (args) {
            console.log(`receive-event: ${messages_1.default.confirm}`);
            let { argument, code } = args;
            let modelName = args.modelName;
            if (!modelName) {
                let err = `Argument modelName is required`;
                raiseError(socket, err);
                return;
            }
            if (!argument) {
                let err = `Argument argument is required`;
                raiseError(socket, err);
                return;
            }
            if (!code) {
                let err = `Argument code is required`;
                raiseError(socket, err);
                return;
            }
            let model = config.models[modelName];
            let method = model.method;
            if (!method) {
                console.log(`Can not find method "${modelName}" in the config.`);
                return;
            }
            console.log(`Method "${modelName}" is exists and will execute.`);
            /** 通过 code 获取用户信息 */
            let sns = weixin_1.create_sns(config.appid, config.secret);
            sns.oauth2.access_token(code)
                .then(obj => {
                console.info('get access token success, user info is:');
                console.log(obj);
                return method(obj, argument);
            })
                .then(o => {
                console.info('execute access_token relactive method success');
                socket.emit(messages_1.default.success);
                console.info(`emit success message to ${masterId}`);
                socket.to(masterId).emit(messages_1.default.success, o);
            })
                .catch(err => {
                console.info('get access token fail, err is:');
                console.info(err);
                socket.emit(messages_1.default.fail, err);
                socket.to(masterId).emit(messages_1.default.fail, err);
            });
        });
    }
    io.listen(server);
    server.listen(config.port);
    return server;
}
exports.run = run;
