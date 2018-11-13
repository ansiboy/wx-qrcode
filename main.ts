// import * as express from 'express'
import * as http from 'http'
import * as path from 'path'
import * as socket_io from 'socket.io'
import messages from './messages'
import { sns } from './weixin';
// import * as cache from 'memory-cache';
import * as url from 'url';
import * as querystring from 'querystring';
import * as fs from 'fs'
require('scribe-js')();

export type Model = {
    method: (openid: string, arg: string) => Promise<any>,
    openid?: string,
    text: {
        title: string,
        content: string,
        confirmButton?: string,
        cancelButton?: string,
        success?: string,
        fail?: string
    }
}

type CacheItem = {
    modelName: string,
    openid?: string,
    Argument?: string,
}

export interface Config {
    appid: string,
    secret: string,
    models: { [name: string]: Model },
    port: number,
}



function image(req: http.IncomingMessage, res: http.ServerResponse, config: Config) {
    let urlInfo = url.parse(req.url);
    let query = querystring.parse(urlInfo.query);
    let from = query.from
    if (!from) {
        res.end('Url parameter "from" is required.')
        return
    }

    let modelName: string = query.model as string
    if (!modelName) {
        res.end('Url parameter "model" is required.')
        return
    }

    let appid = config.appid
    let arg = query.arg as string || ''
    // let cacheItem: CacheItem = { modelName, Argument: arg }
    // cache.put(from, cacheItem)
    console.log(`set cache item for ${from}`)
    let baseURL = 'http://wx-openid.bailunmei.com'
    let redirect_uri = encodeURIComponent(`${baseURL}/openid?from=${from}&modelName=${modelName}&arg=${arg}`);
    let auth_url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirect_uri}&response_type=code&scope=snsapi_base#wechat_redirect`
    let qr = require('qr-image');
    let code = qr.image(auth_url, { type: 'png' });
    console.log(`auth url: ${auth_url}`)
    res.setHeader('Content-type', 'image/png');
    code.pipe(res);
}

async function openid(req: http.IncomingMessage, res: http.ServerResponse, config: Config) {
    let urlInfo = url.parse(req.url);
    let query = querystring.parse(urlInfo.query);
    let { code, from, modelName, arg } = query
    // let { openid } = await sns.oauth2.access_token(config.appid, config.secret, code as string)

    //TODO:处理 cacheItem 为空的情况
    // let cacheItem: CacheItem = cache.get(from)
    // if (cacheItem == null) {
    //     let error = new Error(`Cache item of ${from} is null`)
    //     outputError(res, error)
    //     return
    // }

    //TODO:处理 model 为空的情况
    let model = config.models[modelName as string]
    if (model == null) {
        console.log(`model ${modelName} is null`)
        res.end(`model ${modelName} is null`)
        return
    }

    // cacheItem.openid = openid;

    let pathname = path.join(__dirname, 'wx-page.html')
    console.log(`to read file ${pathname}`)
    fs.readFile(pathname, (err, data) => {
        if (err) {
            outputError(res, err)
            return
        }

        let html = data.toString()
        var vash = require('vash');
        var tpl = vash.compile(html);

        let text = model.text
        var out = tpl({
            title: text.title,//'商家登录',
            content: text.content,//'确定要登录到好易微商城商家后台吗',
            buttonText: text.confirmButton,//'确定登录',
            successText: text.success,
            failText: text.fail,
            code,
            masterId: from,
            modelName,
            argument: arg
        });

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.write(out)
        res.end()
    })
}

function outputError(response: http.ServerResponse, err: Error) {
    console.assert(err != null, 'error is null');
    console.log(err)
    const StatusCodeDefaultError = 600;

    response.statusCode = StatusCodeDefaultError;
    response.statusMessage = err.name;      // statusMessage 不能为中文，否则会出现 invalid chartset 的异常

    if (/^\d\d\d\s/.test(err.name)) {
        response.statusCode = Number.parseInt(err.name.substr(0, 3));
        err.name = err.name.substr(4);
    }

    let outputObject = { message: err.message, name: err.name, stack: err.stack };
    let str = JSON.stringify(outputObject);
    response.write(str);
    response.end();
}

export function setServer(server: http.Server, config: Config) {
    let handler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
        let urlInfo = url.parse(req.url);
        switch (urlInfo.pathname) {
            case '/':
                res.end("")
                break;
            case '/image':
                image(req, res, config)
                break;
            case '/code':
            case '/openid':
                openid(req, res, config)
                break;
            default:
                // 说明该路径没有处理
                if (res.writableLength == 0 && res.writable) {
                    let err = new Error(`Unkonw pathname ${urlInfo.pathname}. url ${req.url}`)
                    throw err
                }
        }
    }

    server.addListener('request', (req: http.IncomingMessage, res: http.ServerResponse) => {
        try {
            handler(req, res)
        }
        catch (err) {
            outputError(res, err)
        }
    })


    let io = socket_io({ path: '/socket.io' })

    io.on('connection', function (socket) {

        let role: 'master' | 'slave' = socket.handshake.query.role
        if (!role) {
            raiseError(socket, 'Query parameter "role" is required.')
            return
        }

        if (role != 'master' && role != 'slave') {
            raiseError(socket, 'Query parameter "role" must be mater or slave.')
            return
        }

        let masterId = socket.handshake.query.masterId
        if (role == 'slave' && !masterId) {
            raiseError(socket, 'Query parameter "masterId" is required.')
            return
        }

        if (role == 'master') {
            processMaster(socket)
        }
        else if (role == 'slave') {
            master_slave_ids[masterId] = socket.id
            processSlave(socket, masterId)
        }
    });

    function raiseError(socket: socket_io.Socket, message: string) {
        console.error(message)
        socket.emit(messages.exception, { message: message })
    }

    let master_slave_ids: { [master_id: string]: string } = {}
    function processMaster(socket: socket_io.Socket) {
        socket.on(messages.success, function (args) {
            let slave_id = master_slave_ids[socket.id]
            console.assert(slave_id)
            socket.to(slave_id).emit(messages.success, args)
        })
    }

    function processSlave(socket: socket_io.Socket, masterId: string) {
        console.log(`socket.id: ${socket.id}`)
        socket.on(messages.exit, function ({ to }) {
            if (!to) {
                let err = 'Arugment "to" is missing.'
                console.error(err)
                socket.emit(messages.exception, { message: err })
                return
            }
            console.log(`${messages.exit}`)
        })

        socket.on(messages.success, function (args) {
            socket.to(masterId).emit(messages.success, args)
        })

        socket.on(messages.fail, function (args) {
            socket.to(masterId).emit(messages.confirm, args)
        })

        socket.on(messages.confirm, function (args) {
            console.log(`event: ${messages.confirm}`)
            let { modelName, argument, code } = args
            if (!modelName) {
                let err = `Argument modeName is required`
                raiseError(socket, err)
                return
            }

            if (!argument) {
                let err = `Argument argument is required`
                raiseError(socket, err)
                return
            }

            if (!code) {
                let err = `Argument code is required`
                raiseError(socket, err)
                return
            }

            let model = config.models[modelName]
            let method = model.method
            if (!method) {
                console.log(`Can not find method "${modelName}" in the config.`)
                return
            }

            console.log(`Method "${modelName}" is exists and will execute.`)
            sns.oauth2.access_token(config.appid, config.secret, code)
                .then(obj => {
                    return method(obj.openid, argument)
                })
                .then(o => {
                    socket.emit(messages.success)
                    socket.to(masterId).emit(messages.success, o)
                })
                .catch(err => {
                    socket.emit(messages.fail, err)
                    socket.to(masterId).emit(messages.fail, err)
                })
        })
    }


    io.listen(server)

    return server
}