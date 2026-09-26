import React, { useState } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js";
import { FunnelIcon } from "@heroicons/react/24/outline";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const calculatePercentages = (
    active,
    needsRepair,
    inactive,
    underRepair,
    total
) => {
    if (total === 0)
        return { active: 0, needsRepair: 0, inactive: 0, underRepair: 0 };

    let activePercent = Math.round((active / total) * 100);
    let needsRepairPercent = Math.round((needsRepair / total) * 100);
    let inactivePercent = Math.round((inactive / total) * 100);
    let underRepairPercent = Math.round((underRepair / total) * 100);

    let totalPercent =
        activePercent + needsRepairPercent + inactivePercent + underRepairPercent;

    if (totalPercent !== 100) {
        const difference = 100 - totalPercent;
        if (active >= needsRepair && active >= inactive && active >= underRepair) {
            activePercent += difference;
        } else if (
            needsRepair >= active &&
            needsRepair >= inactive &&
            needsRepair >= underRepair
        ) {
            needsRepairPercent += difference;
        } else if (
            inactive >= active &&
            inactive >= needsRepair &&
            inactive >= underRepair
        ) {
            inactivePercent += difference;
        } else {
            underRepairPercent += difference;
        }
    }

    return {
        active: activePercent,
        needsRepair: needsRepairPercent,
        inactive: inactivePercent,
        underRepair: underRepairPercent,
    };
};

const DashboardCharts = ({
    aparStatusChart = { active: 0, needsRepair: 0, inactive: 0, underRepair: 0 },
    repairStatusChart = { approved: 0, pending: 0, rejected: 0, completed: 0 },
    inspectionsByDate = [],
    dateRange = [],
    totalApar = 0,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    onApplyDateFilter,
    onResetDateFilter,
}) => {
    const [showDateFilter, setShowDateFilter] = useState(false);

    const statusChartData = {
        labels: ["Aktif", "Perlu Perbaikan", "Nonaktif", "Sedang Perbaikan"],
        datasets: [
            {
                data: [
                    aparStatusChart.active,
                    aparStatusChart.needsRepair,
                    aparStatusChart.inactive,
                    aparStatusChart.underRepair,
                ],
                backgroundColor: ["#10b981", "#f59e0b", "#DA1212", "#11468F"],
                borderWidth: 1,
                borderColor: ["#059669", "#d97706", "#b91c1c", "#0d3873"],
                hoverBackgroundColor: [
                    "#059669",
                    "#d97706",
                    "#b91c1c",
                    "#0d3873",
                ],
            },
        ],
    };

    const repairChartData = {
        labels: ["Disetujui", "Menunggu", "Ditolak", "Selesai"],
        datasets: [
            {
                data: [
                    repairStatusChart.approved,
                    repairStatusChart.pending,
                    repairStatusChart.rejected,
                    repairStatusChart.completed,
                ],
                backgroundColor: ["#10b981", "#f59e0b", "#DA1212", "#11468F"],
                borderWidth: 1,
                borderColor: ["#059669", "#d97706", "#b91c1c", "#0d3873"],
                hoverBackgroundColor: [
                    "#059669",
                    "#d97706",
                    "#b91c1c",
                    "#0d3873",
                ],
            },
        ],
    };

    const inspectionChartData = {
        labels: dateRange.map((day) => {
            const dayNames = {
                Monday: "Sen",
                Tuesday: "Sel",
                Wednesday: "Rab",
                Thursday: "Kam",
                Friday: "Jum",
                Saturday: "Sab",
                Sunday: "Min",
            };
            return dayNames[day] || day;
        }),
        datasets: [
            {
                label: "Baik",
                data: inspectionsByDate.map((item) => item.good),
                backgroundColor: "#11468F",
                borderRadius: 4,
                maxBarThickness: 36,
            },
            {
                label: "Perlu Perbaikan",
                data: inspectionsByDate.map((item) => item.needs_repair),
                backgroundColor: "#f59e0b",
                borderRadius: 4,
                maxBarThickness: 36,
            },
        ],
    };

    const percentages = calculatePercentages(
        aparStatusChart.active,
        aparStatusChart.needsRepair,
        aparStatusChart.inactive,
        aparStatusChart.underRepair,
        totalApar
    );

    const totalInspections = inspectionsByDate.reduce(
        (sum, item) => sum + item.total,
        0
    );
    const totalGoodInspections = inspectionsByDate.reduce(
        (sum, item) => sum + item.good,
        0
    );
    const totalNeedsRepairInspections = inspectionsByDate.reduce(
        (sum, item) => sum + item.needs_repair,
        0
    );

    return (
        <div className="space-y-5">
            {/* Top Row: Dual Status Donuts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                {/* APAR Status Chart */}
                <div className="bg-white rounded-lg p-4 sm:p-5 border border-slate-200/90 shadow-sm transition-all duration-200">
                    <div className="mb-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Kondisi APAR
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Distribusi kesiapan unit
                            </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {totalApar} Unit
                        </span>
                    </div>

                    <div className="h-36 sm:h-40 mb-3.5">
                        <Doughnut
                            data={statusChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                },
                                cutout: "65%",
                            }}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between p-2 bg-slate-50/80 rounded border border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-xs flex-shrink-0"></div>
                                <span className="text-xs text-slate-700 font-medium">
                                    Aktif / Siap
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-emerald-700 text-xs font-mono">
                                    {aparStatusChart.active}
                                </span>
                                <span className="text-slate-400 text-[11px] ml-1 font-mono">
                                    ({percentages.active}%)
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-slate-50/80 rounded border border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-xs flex-shrink-0"></div>
                                <span className="text-xs text-slate-700 font-medium">
                                    Perlu Perbaikan
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-amber-700 text-xs font-mono">
                                    {aparStatusChart.needsRepair}
                                </span>
                                <span className="text-slate-400 text-[11px] ml-1 font-mono">
                                    ({percentages.needsRepair}%)
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-slate-50/80 rounded border border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#DA1212] rounded-xs flex-shrink-0"></div>
                                <span className="text-xs text-slate-700 font-medium">
                                    Nonaktif / Rusak
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-[#DA1212] text-xs font-mono">
                                    {aparStatusChart.inactive}
                                </span>
                                <span className="text-slate-400 text-[11px] ml-1 font-mono">
                                    ({percentages.inactive}%)
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-slate-50/80 rounded border border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#11468F] rounded-xs flex-shrink-0"></div>
                                <span className="text-xs text-slate-700 font-medium">
                                    Sedang Perbaikan
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-[#11468F] text-xs font-mono">
                                    {aparStatusChart.underRepair}
                                </span>
                                <span className="text-slate-400 text-[11px] ml-1 font-mono">
                                    ({percentages.underRepair}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Repair Status Chart */}
                <div className="bg-white rounded-lg p-4 sm:p-5 border border-slate-200/90 shadow-sm transition-all duration-200">
                    <div className="mb-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Tiket Perbaikan
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Progres evaluasi temuan
                            </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200">
                            Evaluasi
                        </span>
                    </div>

                    <div className="h-36 sm:h-40 mb-3.5">
                        <Doughnut
                            data={repairChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                },
                                cutout: "65%",
                            }}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between p-2 bg-slate-50/80 rounded border border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-xs flex-shrink-0"></div>
                                <span className="text-xs text-slate-700 font-medium">
                                    Disetujui
                                </span>
                            </div>
                            <span className="font-bold text-emerald-700 text-xs font-mono">
                                {repairStatusChart.approved}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-slate-50/80 rounded border border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-xs flex-shrink-0"></div>
                                <span className="text-xs text-slate-700 font-medium">
                                    Menunggu Review
                                </span>
                            </div>
                            <span className="font-bold text-amber-700 text-xs font-mono">
                                {repairStatusChart.pending}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-slate-50/80 rounded border border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#DA1212] rounded-xs flex-shrink-0"></div>
                                <span className="text-xs text-slate-700 font-medium">
                                    Ditolak
                                </span>
                            </div>
                            <span className="font-bold text-[#DA1212] text-xs font-mono">
                                {repairStatusChart.rejected}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-slate-50/80 rounded border border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#11468F] rounded-xs flex-shrink-0"></div>
                                <span className="text-xs text-slate-700 font-medium">
                                    Selesai Diperbaiki
                                </span>
                            </div>
                            <span className="font-bold text-[#11468F] text-xs font-mono">
                                {repairStatusChart.completed}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inspections Activity Bar Chart */}
            <div className="bg-white rounded-lg p-4 sm:p-5 border border-slate-200/90 shadow-sm transition-all duration-200">
                <div className="flex items-center justify-between gap-4 mb-3.5 pb-2.5 border-b border-slate-100">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                            Aktivitas Inspeksi Harian
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Volume inspeksi harian: kondisi baik vs perlu perbaikan
                        </p>
                    </div>
                    <button
                        onClick={() => setShowDateFilter(!showDateFilter)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#11468F] hover:text-[#041562] transition-colors p-1.5 rounded hover:bg-blue-50"
                    >
                        <FunnelIcon className="h-3.5 w-3.5" />
                        <span>Filter Tanggal</span>
                    </button>
                </div>

                {/* Date Filter Panel */}
                {showDateFilter && (
                    <div className="mb-4 p-3 bg-slate-50/80 rounded-lg border border-slate-200">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Dari Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-[#11468F] focus:border-[#11468F]"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Sampai Tanggal
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-[#11468F] focus:border-[#11468F]"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={onApplyDateFilter}
                                    className="bg-[#11468F] text-white px-3.5 py-1.5 rounded hover:bg-[#0d3873] transition-colors text-xs font-bold shadow-2xs"
                                >
                                    Terapkan
                                </button>
                                <button
                                    onClick={onResetDateFilter}
                                    className="bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded hover:bg-slate-300 transition-colors text-xs font-bold"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bar Chart Container */}
                <div className="h-44 sm:h-52 mb-4">
                    <Bar
                        data={inspectionChartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: true,
                                    position: "top",
                                    labels: {
                                        usePointStyle: true,
                                        boxWidth: 8,
                                        padding: 12,
                                        font: {
                                            size: 11,
                                            weight: "600",
                                        },
                                    },
                                },
                                tooltip: {
                                    mode: "index",
                                    intersect: false,
                                    cornerRadius: 6,
                                    callbacks: {
                                        title: function (context) {
                                            return context[0].label;
                                        },
                                        label: function (context) {
                                            return (
                                                context.dataset.label +
                                                ": " +
                                                context.parsed.y +
                                                " unit"
                                            );
                                        },
                                    },
                                },
                            },
                            scales: {
                                x: {
                                    stacked: true,
                                    grid: {
                                        color: "#f1f5f9",
                                    },
                                    ticks: {
                                        font: {
                                            size: 11,
                                        },
                                    },
                                },
                                y: {
                                    stacked: true,
                                    beginAtZero: true,
                                    ticks: {
                                        stepSize: 1,
                                        font: {
                                            size: 11,
                                        },
                                    },
                                    grid: {
                                        color: "#f1f5f9",
                                    },
                                },
                            },
                        }}
                    />
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-100">
                    <div className="text-center p-2 bg-emerald-50/60 rounded border border-emerald-100">
                        <div className="text-base sm:text-lg font-black text-emerald-700 font-mono leading-none">
                            {totalGoodInspections}
                        </div>
                        <div className="text-[10px] text-emerald-800 font-bold mt-1">
                            Kondisi Baik
                        </div>
                    </div>
                    <div className="text-center p-2 bg-amber-50/60 rounded border border-amber-100">
                        <div className="text-base sm:text-lg font-black text-amber-700 font-mono leading-none">
                            {totalNeedsRepairInspections}
                        </div>
                        <div className="text-[10px] text-amber-800 font-bold mt-1">
                            Perlu Perbaikan
                        </div>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded border border-slate-200">
                        <div className="text-base sm:text-lg font-black text-slate-900 font-mono leading-none">
                            {totalInspections}
                        </div>
                        <div className="text-[10px] text-slate-600 font-bold mt-1">
                            Total Inspeksi
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
