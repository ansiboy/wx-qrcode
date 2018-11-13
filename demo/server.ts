
import { setServer, Config } from '../out/main';
import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'

let config: Config = {
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
            method(openid: string) {
                return new Promise<any>((resolve, reject) => {
                    resolve()
                })
            }
        }
    },
    port: 58110
}

let server = new http.Server()
server.addListener('request', (req, res) => {
    if (req.url == '/demo') {
        let pathname = path.join(__dirname, 'client.html')
        let data = fs.readFileSync(pathname)
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(data)
    }
})

setServer(server, config)
server.listen(config.port, function () {
    console.log(`listening on *:${config.port}`);
});
