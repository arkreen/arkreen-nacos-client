export interface NacosOptions {
    serviceName: string;
    port: number;
    nacosServerList: string;
    nacosServerNamespace: string;
    nacosServerGroupName?: string;
    nacosServerSubscribeList?: string[];
    nacosConfigNamespace: string;
    nacosConfigGroupName?: string;
    nacosConfigDataIds: string[];
    logger: any;
    config: any;
}
export declare class XenonNacosClient {
    private static logger;
    private static config;
    private static nacosClient;
    private static nacosConfigClient;
    private static console;
    private static options;
    static registerService(options: NacosOptions): Promise<void>;
    static deregisterService(): Promise<void>;
    private static updateConfig;
    private static updateInstances;
}
