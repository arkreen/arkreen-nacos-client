declare class WeightedRoundRobin {
    private _defaultWeight;
    private _pool;
    private _gcdWeight;
    private _currentIndex;
    private _currentWeight;
    private _maxWeight;
    constructor(pool: any, options: any);
    get size(): number;
    /**
     * 重置数据池
     * @param {*} pool
     * @returns
     */
    reset(pool: any): any[];
    /**
     * 欧几里得算法（求最大公约数）
     * @param  {...any} arr
     * @returns
     */
    _gcd(...arr: any): any;
    /**
     * 根据权重挑选出一个实例
     * @returns
     */
    pick(): any;
}
export default WeightedRoundRobin;
