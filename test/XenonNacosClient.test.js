import XenonNacosClient, {NacosOptions} from "../lib";

test('registerService', async () => {
    const options=new NacosOptions()
    options.logger=console
    options.config={}
    options.serviceName='xxxxx'
    options.port=3002

    options.nacosServerList='ip:8848'
    options.nacosNamespace='xxxxxxx'

    options.nacosConfigNamespace='xxxxxx'
    options.nacosConfigDataIds='xxxx.yml,xxx.yml'

    await XenonNacosClient.registerService(options)
});

/*

describe('test/XenonNacosClient.test.js', () => {
    it('registerService', async function () {
        const options=new NacosOptions()
        options.logger=console
        options.config={}
        options.serviceName='notary-service'
        options.port=3002

        options.nacosServerList='101.35.163.23:18848'
        options.nacosNamespace='04c71159-a9af-47fe-a0b5-9aa15e0e9942'

        options.nacosConfigNamespace='fca915d5-78d4-4042-a3c4-94917a06cbc9'
        options.nacosConfigDataIds='notary-service-dev.yml,nodejs-global-dev.yml'

        await XenonNacosClient.registerService(options)
    });
})
*/

