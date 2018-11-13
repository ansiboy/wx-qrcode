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
        access_token: sns_oauth2_access_token
    }
};
function sns_oauth2_access_token(appid, secret, code) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`;
        let response = yield fetch(url);
        let result = response.json();
        let err = isError(result);
        if (err) {
            return Promise.reject(err);
        }
        return result;
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
