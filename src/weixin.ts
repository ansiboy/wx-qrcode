// import config from './config'

global['fetch'] = global['fetch'] || require('node-fetch')

export let sns = {
    oauth2: {
        access_token(appid: string, secret: string, code: string) {
            return sns_oauth2_access_token(appid, secret, code)
        }
    }
}

export function create_sns(appid: string, secret: string) {
    return {
        oauth2: {
            access_token(code: string) {
                return sns_oauth2_access_token(appid, secret, code)
            }
        }
    }
}

export function create_cgi_bin(appid: string, secret: string) {
    return {
        async token(): Promise<{ access_token: string, expires_in: number }> {
            return get_token(appid, secret)
        },
        ticket: {
            async getticket(type: 'wx_card' | 'jsapi') {
                let token = await get_token(appid, secret)
                return cgi_bin_ticket_getticket(token.access_token, type)
            }
        }
        //cgi_bin_ticket_getticket
    }
}

async function sns_oauth2_access_token(appid: string, secret: string, code: string) {

    let url = `https://api.weixin.qq.com/sns/oauth2/access_token`
    let grant_type = 'authorization_code'

    type T = { access_token: string, expires_in: number, refresh_token: string, openid: string, scope: string }
    return ajax.get<T>(url, { appid, secret, code, grant_type })
}


async function cgi_bin_token(appid: string, secret: string) {
    let url = 'https://api.weixin.qq.com/cgi-bin/token'//?grant_type=client_credential&appid=APPID&secret=APPSECRET
    let grant_type = 'client_credential'

    type T = { access_token: string, expires_in: number }
    return ajax.get<T>(url, { grant_type, appid, secret })
}

async function cgi_bin_ticket_getticket(access_token: string, type: 'wx_card' | 'jsapi') {
    let url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket'
    type T = { ticket: string, expires_in: number }
    return ajax.get<T>(url, { access_token, type })
}

function checkToken() {

}


let ajax = {
    async get<T>(url: string, args: any): Promise<T> {
        args = args || {}
        let names = Object.getOwnPropertyNames(args)
        for (let i = 0; i < names.length; i++) {
            let name = names[i]
            let value = args[name]
            if (i == 0)
                url = url + `?${name}=${value}`
            else
                url = url + `&${name}=${value}`
        }

        let response = await fetch(url)
        let result = response.json()

        let err = isError(result)
        if (err) {
            return Promise.reject(err)
        }

        return result
    }
}

let token: { access_token: string, expires_in: number, create_time?: number }
async function get_token(appid: string, secret: string) {
    if (token == null || token.create_time + token.expires_in <= Date.now()) {
        token = await cgi_bin_token(appid, secret)
        token.create_time = Date.now()
    }

    return token
}

function isError(obj: any): Error {
    if (obj.errcode) {
        let err = new Error()
        err.message = obj.errmsg
        err.name = obj.errcode
        return err
    }

    return null
}

// token().then(o => {
//     console.log(o)
// })