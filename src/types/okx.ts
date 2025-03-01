
/**
 * OKX 仓位信息
 * 
 * @property {string} cTime - 仓位创建时间
 * @property {string} ccy - 占用保证金的币种
 * @property {string} closeAvgPx - 平仓均价
 * @property {string} closeTotalPos - 累计平仓量
 * @property {string} direction - 持仓方向 long：多 short：空。仅适用于 币币杠杆/交割/永续/期权
 * @property {string} fee - 累计手续费金额，正数代表平台返佣 ，负数代表平台扣除
 * @property {string} fundingFee - 累计资金费用
 * @property {string} instId -交易产品ID
 * @property {string} instType - 产品类型
 * @property {string} lever - 杠杆倍数
 * @property {string} liqPenalty - 累计爆仓罚金，有值时为负数。
 * @property {string} mgnMode - 保证金模式。cross：全仓，isolated：逐仓
 * @property {string} openAvgPx - 开仓均价
 * @property {string} openMaxPos - 最大持仓量
 * @property {string} pnl - 平仓收益额
 * @property {string} pnlRatio - 已实现收益率
 * @property {string} posId - 仓位ID, 开仓参数相同时, 仓位ID也相同
 * @property {string} posSide - 持仓模式方向。long：开平仓模式开多/short：开平仓模式开空/net：买卖模式
 * @property {string} realizedPnl - 已实现收益。仅适用于交割/永续/期权。realizedPnl=pnl+fee+fundingFee+liqPenalty
 * @property {string} triggerPx - 触发标记价格，type 为 3,4,5 时有值，为 1, 2 时为空字符串
 * @property {string} type - 最近一次平仓的类型。1：部分平仓;2：完全平仓;3：强平;4：强减;5：ADL自动减仓; 状态叠加时，以最新的平仓类型为准状态为准。
 * @property {string} uTime - 仓位更新时间
 * @property {string} uly - 标的指数
 */
export type Position = {
    cTime: string;
    ccy: string;
    closeAvgPx: string;
    closeTotalPos: string;
    direction: string;
    fee: string;
    fundingFee: string;
    instId: string;
    instType: string;
    lever: string;
    liqPenalty: string;
    mgnMode: string;
    openAvgPx: string;
    openMaxPos: string;
    pnl: string;
    pnlRatio: string;
    posId: string;
    posSide: string;
    realizedPnl: string;
    triggerPx: string;
    type: string;
    uTime: string;
    uly: string;
};
