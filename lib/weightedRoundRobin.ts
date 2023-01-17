const DEFAULT_WEIGHT = 10;

class WeightedRoundRobin {
    private _defaultWeight: any;
    private _pool: any[];
    private _gcdWeight: any;
    private _currentIndex: any;
    private _currentWeight: any;
    private _maxWeight: any;
    constructor(pool:any, options:any) {

        const { defaultWeight } = options || {};

        pool = pool || [];

        /** 默认权重 10  */
        this._defaultWeight = defaultWeight || DEFAULT_WEIGHT;

        /** 数据池  */
        this._pool = [];

        /**权重的最大公约数*/
        this._gcdWeight;

        /**上次选择的服务器*/
        this._currentIndex;

        /**当前调度的权值*/
        this._currentWeight;

        /**最大权重*/
        this._maxWeight;

        this.reset(pool);
    }

    get size() {
        return this._pool.length;
    }

    /**
     * 重置数据池
     * @param {*} pool
     * @returns
     */
    reset(pool:any) {
        if (Object.prototype.toString.call(pool) !== '[object Array]') {
            throw new Error('[eggjs-nacos] Property ‘pool’ must is Array!');
        }

        let maxWeight = 0;
        const healthyPool:any = []
        const weights:any = [];
        pool.forEach((item:any) => {
            /** 只保留健康有效的实例 */
            if (Object.prototype.toString.call(item) === '[object Object]' && item.healthy === true) {
                healthyPool.push(item);
                item.weight = item.weight || this._defaultWeight;

                weights.push(item.weight);

                maxWeight = Math.max(maxWeight, item.weight);
            }
        });

        this._gcdWeight = this._gcd(...weights);
        this._maxWeight = maxWeight;
        this._pool = healthyPool;
        this._currentIndex = -1;
        this._currentWeight = 0;

        return this._pool;
    }

    /**
     * 欧几里得算法（求最大公约数）
     * @param  {...any} arr
     * @returns
     */
    _gcd(...arr:any) {
        if (!arr.length) return 0;
        const data:any = [].concat(...arr);

        return data.reduce((x:any, y:any) => {
            return !y ? x : this._gcd(y, x % y);
        });
    }

    /**
     * 根据权重挑选出一个实例
     * @returns
     */
    pick() {
        if (!this.size) return null;
        while (true) {
            this._currentIndex = (this._currentIndex + 1) % this.size;

            if (this._currentIndex === 0) {
                this._currentWeight = this._currentWeight - this._gcdWeight;

                if (this._currentWeight <= 0) {
                    this._currentWeight = this._maxWeight;

                    if (this._currentWeight === 0) return null;
                }
            }

            const service = this._pool[this._currentIndex];

            if (service.weight >= this._currentWeight) {
                return service;
            }
        }
    }

}

export default WeightedRoundRobin;
