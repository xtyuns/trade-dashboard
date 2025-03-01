'use client';

import React, { useState, useEffect, useMemo, useRef } from "react";
import * as echarts from "echarts";
import { getAccountHistoryPosition } from "../api/okx";
import { getHoldingTimeDescription } from "@/utils/okxUtils";
import { Position } from "@/types/okx";

export default function DashboardPage() {
    // 状态管理
    const [positions, setPositions] = useState<Position[]>([]);
    const [dateRange, setDateRange] = useState<
        "today" | "7days" | "30days" | "custom"
    >("7days");
    const [customDateRange, setCustomDateRange] = useState<[string, string]>([
        "",
        "",
    ]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    // 图表引用
    const profitChartRef = useRef<HTMLDivElement>(null);
    const profitRatioChartRef = useRef<HTMLDivElement>(null);
    const distributionChartRef = useRef<HTMLDivElement>(null);
    // 获取仓位列表数据
    useEffect(() => {
        const fetchPositions = async () => {
            const positionsData = await getAccountHistoryPosition(undefined, undefined, 15);
            setPositions(positionsData);
        };
        fetchPositions();
    }, []);

    // 初始化图表
    useEffect(() => {
        const positionsDesc = positions.toReversed();
        // 收益率曲线
        if (profitRatioChartRef.current) {
            const profitRatioChart = echarts.init(profitRatioChartRef.current);
            const profitRatioOption = {
                animation: false,
                title: {
                    text: "收益率趋势",
                    left: "center",
                },
                tooltip: {
                    trigger: "axis",
                    valueFormatter: (value: number) => value + '%',
                },
                xAxis: {
                    type: "category",
                    data: positionsDesc.map((p) => new Date(parseInt(p.cTime)).toLocaleDateString()),
                },
                yAxis: {
                    type: "value",
                    name: "收益率",
                    axisLabel: {
                        formatter: '{value}%',
                    },
                },
                series: [
                    {
                        data: positionsDesc.map((p) => (Number(p.pnlRatio) * 100).toFixed(2)),
                        type: "line",
                        smooth: true,
                    },
                ],
            };
            profitRatioChart.setOption(profitRatioOption);
        }
        // 累计收益曲线
        if (profitChartRef.current) {
            const profitValues = positionsDesc.map((p) => parseFloat(p.pnl));
            const profitAccumulate: number[] = [];
            profitValues.reduce((acc, cur) => {
                const current = parseInt((acc + cur).toFixed(2));
                profitAccumulate.push(current);
                return current;
            }, 0);

            const profitChart = echarts.init(profitChartRef.current);
            const profitOption = {
                animation: false,
                title: {
                    text: "累计收益趋势",
                    left: "center",
                },
                tooltip: {
                    trigger: "axis",
                },
                xAxis: {
                    type: "category",
                    data: positionsDesc.map((p) => new Date(parseInt(p.cTime)).toLocaleDateString()),
                },
                yAxis: {
                    type: "value",
                    name: "累计收益",
                },
                series: [
                    {
                        data: profitAccumulate,
                        type: "line",
                        smooth: true,
                    },
                ],
            };
            profitChart.setOption(profitOption);
        }
        if (distributionChartRef.current) {
            const distributionChart = echarts.init(distributionChartRef.current);
            const distributionOption = {
                animation: false,
                title: {
                    text: "盈亏分布",
                    left: "center",
                },
                tooltip: {
                    trigger: "item",
                },
                series: [
                    {
                        type: "pie",
                        radius: "70%",
                        data: [
                            { value: positionsDesc.filter(it => parseFloat(it.pnl) > 0).length, name: "盈利交易" },
                            { value: positionsDesc.filter(it => parseFloat(it.pnl) < 0).length, name: "亏损交易" },
                        ],
                    },
                ],
            };
            distributionChart.setOption(distributionOption);
        }
    }, [positions]);

    const totalPnlRatio = useMemo(
        () => positions.reduce((total, position) => {
            const convertedPnlRatio = parseFloat(position.pnlRatio) / parseFloat(position.closeTotalPos);
            return total + convertedPnlRatio;
        }, 0),
        [positions],
    );
    const totalPnl = useMemo(
        () => positions.reduce((sum, pos) => sum + Number(pos.pnl), 0).toFixed(2),
        [positions],
    );
    const successRate = useMemo(
        () =>
            (
                (positions.filter((p) => Number(p.pnl) > 0).length / positions.length) *
                100
            ).toFixed(2),
        [positions],
    );
    const averageHoldingTime = useMemo(
        () => {
            if (positions.length === 0) return '0 秒';

            const totalHoldingTime = positions.reduce((acc, position) => {
                return acc + (parseInt(position.uTime) - parseInt(position.cTime));
            }, 0);

            const averageHoldingTime = totalHoldingTime / positions.length;
            return getHoldingTimeDescription(averageHoldingTime);
        },
        [positions],
    );
    const getStatusColor = (type: string) => {
        switch (type) {
            case "1":
                return "text-blue-600";
            case "2":
                return "text-green-600";
            case "3":
                return "text-red-600";
            case "4":
                return "text-yellow-600";
            default:
                return "text-gray-600";
        }
    };
    return (
        <div className="min-h-screen bg-gray-50">
            {/* 顶部导航, todo: select date range */}
            {false && (
                <nav className="bg-white shadow-sm h-16 fixed w-full top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                        <h1 className="text-xl font-semibold text-gray-800">
                            合约历史仓位分析
                        </h1>
                        <div className="flex items-center space-x-4">
                            <button
                                className={`px-4 py-2 bg-blue-600 text-white text-sm !rounded-button whitespace-nowrap flex items-center ${selectedPositions.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={() =>
                                    selectedPositions.length > 0 && setShowAnalysisModal(true)
                                }
                                disabled={selectedPositions.length === 0}
                            >
                                <i className="fas fa-chart-line mr-2"></i>
                                分析选中仓位
                            </button>
                            <div className="flex space-x-2">
                                <button
                                    className={`px-4 py-2 text-sm !rounded-button whitespace-nowrap ${dateRange === "today" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                                    onClick={() => setDateRange("today")}
                                >
                                    今日
                                </button>
                                <button
                                    className={`px-4 py-2 text-sm !rounded-button whitespace-nowrap ${dateRange === "7days" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                                    onClick={() => setDateRange("7days")}
                                >
                                    近7天
                                </button>
                                <button
                                    className={`px-4 py-2 text-sm !rounded-button whitespace-nowrap ${dateRange === "30days" ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                                    onClick={() => setDateRange("30days")}
                                >
                                    近30天
                                </button>
                            </div>
                            <button
                                className="px-4 py-2 bg-green-600 text-white text-sm !rounded-button whitespace-nowrap flex items-center"
                                onClick={() => setShowExportModal(true)}
                            >
                                <i className="fas fa-download mr-2"></i>
                                导出数据
                            </button>
                        </div>
                    </div>
                </nav>
            )}
            {/* 主要内容区域 */}
            <div className="pt-20 px-6">
                {/* 数据概览卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="text-gray-500 text-sm mb-2">总收益率</div>
                        <div className={`text-2xl font-semibold ${Number(totalPnlRatio) >= 0 ? "text-green-600" : "text-red-600"}`}>{(Number(totalPnlRatio) * 100).toFixed(2)}%</div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="text-gray-500 text-sm mb-2">总盈亏金额</div>
                        <div className={`text-2xl font-semibold ${Number(totalPnl) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {totalPnl} USDT
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="text-gray-500 text-sm mb-2">成功率</div>
                        <div className="text-2xl font-semibold text-blue-600">{successRate}%</div>
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="text-gray-500 text-sm mb-2">平均持仓时间</div>
                        <div className="text-2xl font-semibold text-gray-800">{averageHoldingTime}</div>
                    </div>
                </div>
                {/* 图表和列表区域 */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* 左侧列表 */}
                    <div className="lg:w-2/3">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="mb-6 flex justify-between items-center">
                                <h2 className="text-lg font-semibold">仓位记录</h2>
                            </div>
                            {/* 表格 */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300"
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        setSelectedPositions(
                                                            isChecked ? positions.map((p) => p.cTime) : [],
                                                        );
                                                    }}
                                                    checked={
                                                        selectedPositions.length === positions.length
                                                    }
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                交易对
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                方向
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                杠杆
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                收益额
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                收益率
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                状态
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                减仓时间
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                清仓时间
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                持仓时间
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {positions.map((position, index) => (
                                            <tr key={position.cTime} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300"
                                                        checked={selectedPositions.includes(position.cTime)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedPositions([
                                                                    ...selectedPositions,
                                                                    position.cTime,
                                                                ]);
                                                            } else {
                                                                setSelectedPositions(
                                                                    selectedPositions.filter(
                                                                        (id) => id !== position.cTime,
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-900">
                                                    {position.instId}
                                                </td>
                                                <td className="px-4 py-4 text-sm">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs ${position.direction === "long" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                                    >
                                                        {position.direction === "long" ? "多" : "空"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {position.lever}x
                                                </td>
                                                <td className="px-4 py-4 text-sm">
                                                    <span
                                                        className={
                                                            Number(position.pnl) > 0
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }
                                                    >
                                                        {Number(position.pnl).toFixed(2)} USDT
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm">
                                                    <span
                                                        className={
                                                            Number(position.pnlRatio) > 0
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }
                                                    >
                                                        {(Number(position.pnlRatio) * 100).toFixed(2)}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`${getStatusColor(position.type)}`}>
                                                        {
                                                            [
                                                                "部分平仓",
                                                                "完全平仓",
                                                                "强平",
                                                                "强减",
                                                                "ADL自动减仓",
                                                            ][Number(position.type) - 1]
                                                        }
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(parseInt(position.cTime)).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(parseInt(position.uTime)).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {getHoldingTimeDescription(parseInt(position.uTime) - parseInt(position.cTime))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    {/* 右侧图表 */}
                    <div className="lg:w-1/3">
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <div ref={profitRatioChartRef} style={{ height: "250px" }}></div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <div ref={profitChartRef} style={{ height: "250px" }}></div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div ref={distributionChartRef} style={{ height: "245px" }}></div>
                        </div>
                    </div>
                </div>
            </div>
            {/* 交易行为分析弹窗 */}
            {showAnalysisModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold">交易行为分析</h3>
                            <button
                                onClick={() => setShowAnalysisModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* 交易习惯分析 */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-lg font-medium mb-3">交易习惯分析</h4>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">
                                        • 平均持仓时间:{" "}
                                        <span className="font-medium">18.5小时</span> -
                                        建议适当延长持仓时间，避免过度交易
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        • 胜率:{" "}
                                        <span className="font-medium text-green-600">65.8%</span> -
                                        交易胜率良好，建议保持当前交易策略
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        • 平均盈亏比:{" "}
                                        <span className="font-medium text-red-600">1:0.8</span> -
                                        建议提高止盈目标，降低止损位置
                                    </p>
                                </div>
                            </div>

                            {/* 风险控制建议 */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-lg font-medium mb-3">风险控制建议</h4>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">
                                        • 建议单笔仓位不超过总资金的 5%
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        • 当前杠杆倍数偏高，建议降低至 10 倍以下
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        • 建议设置止损，控制单笔最大回撤在 2% 以内
                                    </p>
                                </div>
                            </div>

                            {/* 交易改进建议 */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-lg font-medium mb-3">交易改进建议</h4>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">
                                        • 选择更好的入场时机，避免追涨杀跌
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        • 建议在趋势明确时增加仓位
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        • 避免在高波动期频繁交易
                                    </p>
                                </div>
                            </div>

                            {/* 市场洞察 */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-lg font-medium mb-3">市场洞察</h4>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">
                                        • BTC-USDT 当前处于上升趋势，建议持有多头仓位
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        • 市场波动率处于相对低位，可以考虑逐步建仓
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        • 建议关注重要支撑位 42000 和阻力位 44000
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 导出弹窗 */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">导出数据</h3>
                        <div className="space-y-4">
                            <button
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm !rounded-button whitespace-nowrap"
                                onClick={() => setShowExportModal(false)}
                            >
                                导出 Excel
                            </button>
                            <button
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm !rounded-button whitespace-nowrap"
                                onClick={() => setShowExportModal(false)}
                            >
                                导出 CSV
                            </button>
                            <button
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm !rounded-button whitespace-nowrap"
                                onClick={() => setShowExportModal(false)}
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};