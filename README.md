## xenon-nacos-client

连接到nacos注册中心，订阅服务，订阅配置，当服务更新后会自动更新传入的全局配置对象



#### install

```shell
yarn add nacos yaml ip xenon-nacos-client log4js
```



#### Usage

typescript:

```typescript
import {XenonNacosClient} from "xenon-nacos-client"
import {getLogger} from 'log4js'
const logger = getLogger("out")


try{
    const config={}
    
    const options={
        // 日志工具类，log4js
        logger:logger,
        // 配置信息，当配置发生变化的时候会自动更新到该对象中
        config:config,
        //服务的名称，不要和已有服务重名
        serviceName:'XXXX',
        //服务的运行端口号
        port:3002,
        //nacos服务地址
        nacosServerList:'ip:8848',
        //服务注册的namespace
        nacosServerNamespace:'04c71159-a9af-47fe-a0b5-9aa15e0e9942',
        //需要订阅的服务名称列表
        nacosServerSubscribeList:['account'],
        //服务配置的namespace,通常和nacosNamespace 相同
        nacosConfigNamespace:'fca915d5-78d4-4042-a3c4-94917a06cbc9',
        //需要订阅的配置文件
        nacosConfigDataIds:['notary-service-dev.yml','nodejs-global-dev.yml'] 
    }
    //注册服务
    await XenonNacosClient.registerService(options)
    logger.info("nacos connect success!")
}catch (e){
    //输出异常信息
    logger.error(e) 
}
```

javascript:

```javascript
const {XenonNacosClient} = require("xenon-nacos-client");
var log4js = require("log4js")
const logger = log4js.getLogger("out")


try{
    
    const config={}
    
    const options={
        // 日志工具类，log4js
        logger:logger,
        // 配置信息，当配置发生变化的时候会自动更新到该对象中
        config:config,
        //服务的名称，不要和已有服务重名
        serviceName:'XXXX',
        //服务的运行端口号
        port:3002,
        //nacos服务地址
        nacosServerList:'ip:8848',
        //服务注册的namespace
        nacosServerNamespace:'04c71159-a9af-47fe-a0b5-9aa15e0e9942',
        //需要订阅的服务名称列表
        nacosServerSubscribeList:['xxx'],
        //服务配置的namespace,通常和nacosNamespace 相同
        nacosConfigNamespace:'fca915d5-78d4-4042-a3c4-94917a06cbc9',
        //需要订阅的配置文件
        nacosConfigDataIds:['xxx.yml','xxx.yml'] 
    }
    //注册服务
    await XenonNacosClient.registerService(options)
    logger.info("nacos connect success!")
}catch (e){
    //输出异常信息
    logger.error(e) 
}
```

