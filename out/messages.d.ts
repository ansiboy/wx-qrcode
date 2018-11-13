declare let messages: {
    exception: string;
    /** 用户已经扫描二维码 */
    scan: string;
    /** 用户已退出 */
    exit: string;
    /** 用户确认操作 */
    confirm: string;
    /** 用户取消操作 */
    cancel: string;
    /** 操作成功 */
    success: string;
    /** 端操作失败 */
    fail: string;
};
export default messages;
