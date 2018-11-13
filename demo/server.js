"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("../main");
const http = require("http");
const fs = require("fs");
const path = require("path");
let config = {
    appid: 'wx30ac5294d9f38751',
    secret: '6ade81ea20d2d1f902ac2c4d00691349',
    models: {
        /** 扫描登陆 */
        login: {
            text: {
                title: '商家登录',
                content: '确定要登录到好易微商城商家后台吗',
                confirmButton: '确定登录',
                cancelButton: '取消',
                success: '登录成功',
                fail: '登录失败，请重新扫描二维码进行登录'
            },
            method(openid) {
                return new Promise((resolve, reject) => {
                    resolve();
                });
            }
        }
    },
    port: 58110
};
let server = new http.Server();
server.addListener('request', (req, res) => {
    if (req.url == '/demo') {
        let pathname = path.join(__dirname, 'client.html');
        let data = fs.readFileSync(pathname);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(data);
    }
});
main_1.setServer(server, config);
server.listen(config.port, function () {
    console.log(`listening on *:${config.port}`);
});
