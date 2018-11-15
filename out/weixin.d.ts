export declare let sns: {
    oauth2: {
        access_token(appid: string, secret: string, code: string): Promise<{
            access_token: string;
            expires_in: number;
            refresh_token: string;
            openid: string;
            scope: string;
        }>;
    };
};
export declare function create_sns(appid: string, secret: string): {
    oauth2: {
        access_token(code: string): Promise<{
            access_token: string;
            expires_in: number;
            refresh_token: string;
            openid: string;
            scope: string;
        }>;
    };
};
export declare function create_cgi_bin(appid: string, secret: string): {
    token(): Promise<{
        access_token: string;
        expires_in: number;
    }>;
    ticket: {
        getticket(type: "wx_card" | "jsapi"): Promise<{
            ticket: string;
            expires_in: number;
        }>;
    };
};
