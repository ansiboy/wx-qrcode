"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let messages = {
    exception: 'exception',
    //==================================
    // 服务端发射的消息
    /** 用户已经扫描二维码 */
    scan: 'scan',
    //==================================
    // 移动端发射的消息
    /** 用户已退出 */
    exit: 'exit',
    /** 用户确认操作 */
    confirm: 'confirm',
    /** 用户取消操作 */
    cancel: 'cancel',
    //==================================
    // PC端发射的消息
    /** 操作成功 */
    success: 'success',
    /** 端操作失败 */
    fail: 'fail',
};
exports.default = messages;
