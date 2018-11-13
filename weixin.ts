// import config from './config'

global['fetch'] = global['fetch'] || require('node-fetch')

export let sns = {
    oauth2: {
        access_token: sns_oauth2_access_token
    }
}

async function sns_oauth2_access_token(appid: string, secret: string, code: string):
    Promise<{ access_token: string, expires_in: number, refresh_token: string, openid: string, scope: string }> {

    let url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`
    let response = await fetch(url)
    let result = response.json()

    let err = isError(result)
    if (err) {
        return Promise.reject(err)
    }

    return result
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