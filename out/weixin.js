"use strict";
// import config from './config'
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
global['fetch'] = global['fetch'] || require('node-fetch');
exports.sns = {
    oauth2: {
        access_token(appid, secret, code) {
            return sns_oauth2_access_token(appid, secret, code);
        }
    }
};
function create_sns(appid, secret) {
    return {
        oauth2: {
            access_token(code) {
                return sns_oauth2_access_token(appid, secret, code);
            }
        }
    };
}
exports.create_sns = create_sns;
function create_cgi_bin(appid, secret) {
    return {
        token() {
            return __awaiter(this, void 0, void 0, function* () {
                return get_token(appid, secret);
            });
        },
        ticket: {
            getticket(type) {
                return __awaiter(this, void 0, void 0, function* () {
                    let token = yield get_token(appid, secret);
                    return cgi_bin_ticket_getticket(token.access_token, type);
                });
            }
        }
        //cgi_bin_ticket_getticket
    };
}
exports.create_cgi_bin = create_cgi_bin;
function sns_oauth2_access_token(appid, secret, code) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = `https://api.weixin.qq.com/sns/oauth2/access_token`;
        let grant_type = 'authorization_code';
        return ajax.get(url, { appid, secret, code, grant_type });
    });
}
function cgi_bin_token(appid, secret) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = 'https://api.weixin.qq.com/cgi-bin/token'; //?grant_type=client_credential&appid=APPID&secret=APPSECRET
        let grant_type = 'client_credential';
        return ajax.get(url, { grant_type, appid, secret });
    });
}
function cgi_bin_ticket_getticket(access_token, type) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket';
        return ajax.get(url, { access_token, type });
    });
}
function checkToken() {
}
let ajax = {
    get(url, args) {
        return __awaiter(this, void 0, void 0, function* () {
            args = args || {};
            let names = Object.getOwnPropertyNames(args);
            for (let i = 0; i < names.length; i++) {
                let name = names[i];
                let value = args[name];
                if (i == 0)
                    url = url + `?${name}=${value}`;
                else
                    url = url + `&${name}=${value}`;
            }
            let response = yield fetch(url);
            let result = response.json();
            let err = isError(result);
            if (err) {
                return Promise.reject(err);
            }
            return result;
        });
    }
};
let token;
function get_token(appid, secret) {
    return __awaiter(this, void 0, void 0, function* () {
        if (token == null || token.create_time + token.expires_in <= Date.now()) {
            token = yield cgi_bin_token(appid, secret);
            token.create_time = Date.now();
        }
        return token;
    });
}
function isError(obj) {
    if (obj.errcode) {
        let err = new Error();
        err.message = obj.errmsg;
        err.name = obj.errcode;
        return err;
    }
    return null;
}
// token().then(o => {
//     console.log(o)
// })
