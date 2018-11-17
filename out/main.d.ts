/// <reference types="node" />
import * as http from 'http';
export declare type Model = {
    method: (userInfo: {
        openid: string;
    }, arg: string) => Promise<any>;
    openid?: string;
    text: {
        title: string;
        content: string;
        confirmButton?: string;
        cancelButton?: string;
        success?: string;
        fail?: string;
    };
};
export interface Config {
    appid: string;
    secret: string;
    models: {
        [name: string]: Model;
    };
    port: number;
}
export declare function jsSignature(req: any, res: http.ServerResponse, config: Config): Promise<void>;
export declare function run(config: Config, logger?: Console): http.Server;
