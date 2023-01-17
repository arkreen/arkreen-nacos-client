import {NacosConfigClient, NacosNamingClient} from "nacos";
import { address } from 'ip'
import {Hosts} from "nacos-naming";
import YAML from "yaml";
import WeightedRoundRobin from "./weightedRoundRobin";
import assert from "assert";
import path from "path";

export interface NacosOptions {
    serviceName:string
    port:number

    nacosServerList:string
    nacosServerNamespace:string
    nacosServerGroupName?:string
    nacosServerSubscribeList?:string[]

    nacosConfigNamespace:string
    nacosConfigGroupName?:string
    nacosConfigDataIds:string[]

    logger:any
    config:any
}

export class XenonNacosClient{
    private static logger:any
    private static config:any
    private static nacosClient:NacosNamingClient
    private static nacosConfigClient:NacosConfigClient
    private static console:Console

    private static options:NacosOptions

    static async registerService(options:NacosOptions){


        assert(!!options.serviceName, 'Property ‘serviceName’ is required!')
        assert(!!options.port, 'Property ‘port’ is required!')
        assert(!!options.logger, 'Property ‘logger’ is required!')
        assert(!!options.config, 'Property ‘config’ is required!')

        assert(!!options.nacosServerList, 'Property ‘nacosServerList’ is required!')
        assert(!!options.nacosServerNamespace, 'Property ‘nacosNamespace’ is required!')
        if(!options.nacosServerGroupName){
            options.nacosServerGroupName='DEFAULT_GROUP'
        }

        assert(!!options.nacosConfigNamespace, 'Property ‘nacosConfigNamespace’ is required!')
        assert(!!options.nacosConfigDataIds, 'Property ‘nacosConfigDataIds’ is required!')
        if(!options.nacosConfigGroupName){
            options.nacosConfigGroupName='DEFAULT_GROUP'
        }
        XenonNacosClient.options=options

        XenonNacosClient.logger=options.logger
        XenonNacosClient.config=options.config
        XenonNacosClient.console=Object.create(console, {
            info:{
                value: function info(message:string, ...args:any) {
                    XenonNacosClient.logger.info(message,args)
                }
            },
            warn:{
                value: function info(message:string, ...args:any) {
                    XenonNacosClient.logger.warn(message,args)
                }
            },
            log:{
                value: function info(message:string, ...args:any) {
                    XenonNacosClient.logger.log(message,args)
                }
            },
            error:{
                value: function info(message:string, ...args:any) {
                    XenonNacosClient.logger.error(message,args)
                }
            },
            debug:{
                value: function info(message:string, ...args:any) {
                    if(message.indexOf("updateServiceNow()")!=-1){
                        // logger.info(message,args)
                        return false
                    }
                    XenonNacosClient.logger.debug(message,args)
                }
            }
        });

        XenonNacosClient.nacosClient = new NacosNamingClient({
            logger:XenonNacosClient.console,
            serverList: XenonNacosClient.options.nacosServerList,
            namespace: XenonNacosClient.options.nacosServerNamespace
        });
        await XenonNacosClient.nacosClient.ready();

        XenonNacosClient.logger.info("nacos is ready...")


        const ip = address();

        const registerResult=await XenonNacosClient.nacosClient.registerInstance(XenonNacosClient.options.serviceName, {
            ip: ip as string,
            port: XenonNacosClient.options.port,
        },XenonNacosClient.options.nacosServerGroupName);

        XenonNacosClient.logger.info("nacos register result="+registerResult)

        if(XenonNacosClient.options.nacosServerSubscribeList){
            for(const serviceName of XenonNacosClient.options.nacosServerSubscribeList){
                const instanceList:Hosts= await XenonNacosClient.nacosClient.getAllInstances(serviceName)
                if(instanceList.length>0){
                    const activeInstanceList=instanceList.filter((item:any)=>item['healthy'])
                    XenonNacosClient.updateInstances(serviceName,activeInstanceList)
                }
                XenonNacosClient.logger.info(`init subscribe servicename=%s,instanceList=%s`,serviceName,JSON.stringify(instanceList));
                XenonNacosClient.nacosClient.subscribe({
                    serviceName: serviceName,
                    groupName: XenonNacosClient.options.nacosServerGroupName,
                }, hosts => {
                    const activeInstanceList=hosts.filter((item:any)=>item['healthy'])
                    XenonNacosClient.updateInstances(serviceName,activeInstanceList)
                    XenonNacosClient.logger.info(`subscribe service update=%s`,JSON.stringify(hosts));
                });
            }
        }
        //配置中心

        XenonNacosClient.nacosConfigClient = new NacosConfigClient({
            serverAddr: XenonNacosClient.options.nacosServerList,
            namespace: XenonNacosClient.options.nacosConfigNamespace
        });
        XenonNacosClient.logger.info("nacos config ....")

        if(XenonNacosClient.options.nacosConfigDataIds) {
            for (const item of XenonNacosClient.options.nacosConfigDataIds) {
                const content = await XenonNacosClient.nacosConfigClient.getConfig(item, XenonNacosClient.options.nacosConfigGroupName);
                if(content){
                    const extname=path.extname(item)
                    let json={}
                    if(extname==='.yml' || extname ==='.yaml'){
                         json = YAML.parse(content)
                    }else if(extname==='.json'){
                        json=JSON.parse(content)
                    }else{
                        throw new Error(item+' the file format is not supported ')
                    }
                    XenonNacosClient.updateConfig(json)
                    XenonNacosClient.logger.info(`init subscribe config name=%s,config=%s`, item, content)
                }
                XenonNacosClient.nacosConfigClient.subscribe({
                    dataId: item,
                    group: XenonNacosClient.options.nacosConfigGroupName,
                }, (content: string) => {
                    XenonNacosClient.logger.info("nacos config update=" + content)
                    const extname=path.extname(item)
                    let json={}
                    if(extname==='.yml' || extname ==='.yaml'){
                        json = YAML.parse(content)
                    }else if(extname==='.json'){
                        json=JSON.parse(content)
                    }else{
                        throw new Error(item+' the file format is not supported ')
                    }
                    XenonNacosClient.updateConfig(json)
                });
            }
        }
    }

    static async deregisterService(){
        const ip = address();
        await XenonNacosClient.nacosClient.deregisterInstance(XenonNacosClient.options.serviceName, {
            ip: ip as string,
            port: XenonNacosClient.options.port,
        })
    }

    private static updateConfig(newConfig:any){
        Object.assign(XenonNacosClient.config, newConfig);
    }
    private static updateInstances(serviceName:string,newInstances:any){
        if(!XenonNacosClient.config.nacosInstances){
            XenonNacosClient.config['nacosInstances']={}
        }
        if(newInstances.length==0){
            delete XenonNacosClient.config.nacosInstances[serviceName]
        }else if(XenonNacosClient.config.nacosInstances[serviceName]){
            XenonNacosClient.config.nacosInstances[serviceName].reset(newInstances)
        }else{
            XenonNacosClient.config.nacosInstances[serviceName]=new WeightedRoundRobin(newInstances,{})
        }
        Object.assign(XenonNacosClient.config.nacosInstances, newInstances);
    }
}

