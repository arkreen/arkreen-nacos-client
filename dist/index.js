"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XenonNacosClient = void 0;
const nacos_1 = require("nacos");
const ip_1 = require("ip");
const yaml_1 = __importDefault(require("yaml"));
const weightedRoundRobin_1 = __importDefault(require("./weightedRoundRobin"));
const assert_1 = __importDefault(require("assert"));
const path_1 = __importDefault(require("path"));
class XenonNacosClient {
    static registerService(options) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, assert_1.default)(!!options.serviceName, 'Property ‘serviceName’ is required!');
            (0, assert_1.default)(!!options.port, 'Property ‘port’ is required!');
            (0, assert_1.default)(!!options.logger, 'Property ‘logger’ is required!');
            (0, assert_1.default)(!!options.config, 'Property ‘config’ is required!');
            (0, assert_1.default)(!!options.nacosServerList, 'Property ‘nacosServerList’ is required!');
            (0, assert_1.default)(!!options.nacosServerNamespace, 'Property ‘nacosNamespace’ is required!');
            if (!options.nacosServerGroupName) {
                options.nacosServerGroupName = 'DEFAULT_GROUP';
            }
            (0, assert_1.default)(!!options.nacosConfigNamespace, 'Property ‘nacosConfigNamespace’ is required!');
            (0, assert_1.default)(!!options.nacosConfigDataIds, 'Property ‘nacosConfigDataIds’ is required!');
            if (!options.nacosConfigGroupName) {
                options.nacosConfigGroupName = 'DEFAULT_GROUP';
            }
            XenonNacosClient.options = options;
            XenonNacosClient.logger = options.logger;
            XenonNacosClient.config = options.config;
            XenonNacosClient.console = Object.create(console, {
                info: {
                    value: function info(message, ...args) {
                        XenonNacosClient.logger.info(message, args);
                    }
                },
                warn: {
                    value: function info(message, ...args) {
                        XenonNacosClient.logger.warn(message, args);
                    }
                },
                log: {
                    value: function info(message, ...args) {
                        XenonNacosClient.logger.log(message, args);
                    }
                },
                error: {
                    value: function info(message, ...args) {
                        XenonNacosClient.logger.error(message, args);
                    }
                },
                debug: {
                    value: function info(message, ...args) {
                        if (message.indexOf("updateServiceNow()") != -1) {
                            // logger.info(message,args)
                            return false;
                        }
                        XenonNacosClient.logger.debug(message, args);
                    }
                }
            });
            XenonNacosClient.nacosClient = new nacos_1.NacosNamingClient({
                logger: XenonNacosClient.console,
                serverList: XenonNacosClient.options.nacosServerList,
                namespace: XenonNacosClient.options.nacosServerNamespace
            });
            yield XenonNacosClient.nacosClient.ready();
            XenonNacosClient.logger.info("nacos is ready...");
            const ip = (0, ip_1.address)();
            const registerResult = yield XenonNacosClient.nacosClient.registerInstance(XenonNacosClient.options.serviceName, {
                ip: ip,
                port: XenonNacosClient.options.port,
            }, XenonNacosClient.options.nacosServerGroupName);
            XenonNacosClient.logger.info("nacos register result=" + registerResult);
            if (XenonNacosClient.options.nacosServerSubscribeList) {
                for (const serviceName of XenonNacosClient.options.nacosServerSubscribeList) {
                    const instanceList = yield XenonNacosClient.nacosClient.getAllInstances(serviceName);
                    if (instanceList.length > 0) {
                        const activeInstanceList = instanceList.filter((item) => item['healthy']);
                        XenonNacosClient.updateInstances(serviceName, activeInstanceList);
                    }
                    XenonNacosClient.logger.info(`init subscribe servicename=%s,instanceList=%s`, serviceName, JSON.stringify(instanceList));
                    XenonNacosClient.nacosClient.subscribe({
                        serviceName: serviceName,
                        groupName: XenonNacosClient.options.nacosServerGroupName,
                    }, hosts => {
                        const activeInstanceList = hosts.filter((item) => item['healthy']);
                        XenonNacosClient.updateInstances(serviceName, activeInstanceList);
                        XenonNacosClient.logger.info(`subscribe service update=%s`, JSON.stringify(hosts));
                    });
                }
            }
            //配置中心
            XenonNacosClient.nacosConfigClient = new nacos_1.NacosConfigClient({
                serverAddr: XenonNacosClient.options.nacosServerList,
                namespace: XenonNacosClient.options.nacosConfigNamespace
            });
            XenonNacosClient.logger.info("nacos config ....");
            if (XenonNacosClient.options.nacosConfigDataIds) {
                for (const item of XenonNacosClient.options.nacosConfigDataIds) {
                    const content = yield XenonNacosClient.nacosConfigClient.getConfig(item, XenonNacosClient.options.nacosConfigGroupName);
                    if (content) {
                        const extname = path_1.default.extname(item);
                        let json = {};
                        if (extname === '.yml' || extname === '.yaml') {
                            json = yaml_1.default.parse(content);
                        }
                        else if (extname === '.json') {
                            json = JSON.parse(content);
                        }
                        else {
                            throw new Error(item + ' the file format is not supported ');
                        }
                        XenonNacosClient.updateConfig(json);
                        XenonNacosClient.logger.info(`init subscribe config name=%s,config=%s`, item, content);
                    }
                    XenonNacosClient.nacosConfigClient.subscribe({
                        dataId: item,
                        group: XenonNacosClient.options.nacosConfigGroupName,
                    }, (content) => {
                        XenonNacosClient.logger.info("nacos config update=" + content);
                        const extname = path_1.default.extname(item);
                        let json = {};
                        if (extname === '.yml' || extname === '.yaml') {
                            json = yaml_1.default.parse(content);
                        }
                        else if (extname === '.json') {
                            json = JSON.parse(content);
                        }
                        else {
                            throw new Error(item + ' the file format is not supported ');
                        }
                        XenonNacosClient.updateConfig(json);
                    });
                }
            }
        });
    }
    static deregisterService() {
        return __awaiter(this, void 0, void 0, function* () {
            const ip = (0, ip_1.address)();
            yield XenonNacosClient.nacosClient.deregisterInstance(XenonNacosClient.options.serviceName, {
                ip: ip,
                port: XenonNacosClient.options.port,
            });
        });
    }
    static updateConfig(newConfig) {
        Object.assign(XenonNacosClient.config, newConfig);
    }
    static updateInstances(serviceName, newInstances) {
        if (!XenonNacosClient.config.nacosInstances) {
            XenonNacosClient.config['nacosInstances'] = {};
        }
        if (newInstances.length == 0) {
            delete XenonNacosClient.config.nacosInstances[serviceName];
        }
        else if (XenonNacosClient.config.nacosInstances[serviceName]) {
            XenonNacosClient.config.nacosInstances[serviceName].reset(newInstances);
        }
        else {
            XenonNacosClient.config.nacosInstances[serviceName] = new weightedRoundRobin_1.default(newInstances, {});
        }
        Object.assign(XenonNacosClient.config.nacosInstances, newInstances);
    }
}
exports.XenonNacosClient = XenonNacosClient;
