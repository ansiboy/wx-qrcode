const { create_cgi_bin } = require('../out/weixin')
const sha1 = require('js-sha1')
let assert = require('assert');
let appid = 'wxf1c24c60e3ac13b7'
let secret = '5902b9817acb7a290d4b7c2e6e97d4d3'

describe('cgi_bin', function () {
    let cgi_bin = create_cgi_bin(appid, secret)
    describe('#token()', function () {
        it('access_token is not null', async function () {
            let token = await cgi_bin.token()
            console.log(token)
            assert.notEqual(token.access_token, null)
        });

        it('ticket.getticket', async function () {
            let t = await cgi_bin.ticket.getticket('jsapi')
            console.log(t)
            assert.notEqual(t.ticket, null)
        })

        it('t', async function () {
            let noncestr = 'noncestr'
            let timestamp = (Date.now() / 1000).toFixed()
            let t = await cgi_bin.ticket.getticket('jsapi')
            let url = 'www.163.com'
            let str = `jsapi_ticket=${t.ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`
            console.log(str)
            var hash = sha1(str)
            console.log(hash)
        })

    });
});