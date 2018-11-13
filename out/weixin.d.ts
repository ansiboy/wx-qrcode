export declare let sns: {
    oauth2: {
        access_token: typeof sns_oauth2_access_token;
    };
};
declare function sns_oauth2_access_token(appid: string, secret: string, code: string): Promise<{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    openid: string;
    scope: string;
}>;
export {};
