"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    TrendingUp, Users, Clock, ShoppingCart,
    Coins, AlertTriangle, Brain,
    ArrowUpRight, ArrowDownRight, RefreshCw,
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";

interface PnL {
    revenue: number;
    labour_cost: number;
    labour_cost_pct: number;
    gross_margin_estimate: number;
    transaction_count: number;
    avg_transaction: number;
}

interface AIInsight {
    id: string;
    insight_type: string;
    severity: "info" | "warning" | "critical";
    title: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

function KpiCard({
    title, value, subtitle, icon: Icon, trend, trendValue, color = "gold",
}: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    trend?: "up" | "down";
    trendValue?: string;
    color?: "gold" | "green" | "red" | "blue";
}) {
    const colorMap = {
        gold: "text-[#C9A84C] bg-[#C9A84C]/10",
        green: "text-emerald-400 bg-emerald-400/10",
        red: "text-red-400 bg-red-400/10",
        blue: "text-blue-400 bg-blue-400/10",
    };
    return (
        <div className="bg-[#16213E] border border-white/10 rounded-xl p-5 hover:border-[#C9A84C]/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorMap[color])}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && trendValue && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                        trend === "up" ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
                    )}>
                        {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trendValue}
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-sm font-medium text-gray-300">{title}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
    );
}

function InsightCard({ insight }: { insight: AIInsight }) {
    const severityConfig = {
        info: { color: "text-blue-400 bg-blue-400/10 border-blue-400/20", dot: "bg-blue-400" },
        warning: { color: "text-amber-400 bg-amber-400/10 border-amber-400/20", dot: "bg-amber-400" },
        critical: { color: "text-red-400 bg-red-400/10 border-red-400/20", dot: "bg-red-400" },
    };
    const config = severityConfig[insight.severity];
    return (
        <div className={cn(
            "p-4 rounded-lg border",
            !insight.is_read ? "bg-white/5 border-white/10" : "bg-transparent border-white/5 opacity-60"
        )}>
            <div className="flex items-start gap-3">
                <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", config.dot)} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{insight.title}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{insight.content}</p>
                    <p className="text-xs text-gray-600 mt-2">
                        {format(new Date(insight.created_at), "dd MMM, HH:mm")}
                    </p>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full border flex-shrink-0", config.color)}>
                    {insight.severity}
                </span>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

    const { data: pnl, isLoading: pnlLoading } = useQuery<PnL>({
        queryKey: ["pnl", weekStart],
        queryFn: async () => {
            const { data } = await api.get(`/finance/pnl/weekly?week_start=${weekStart}`);
            return data;
        },
        refetchInterval: 60000,
    });

    const { data: insights, isLoading: insightsLoading } = useQuery<AIInsight[]>({
        queryKey: ["insights"],
        queryFn: async () => {
            const { data } = await api.get("/ai/insights?limit=5");
            return data;
        },
        refetchInterval: 120000,
    });

    const { data: staffList } = useQuery({
        queryKey: ["staff"],
        queryFn: async () => {
            const { data } = await api.get("/staff/");
            return data;
        },
    });

    const staffTotal = staffList?.length || 0;
    const staffActive = staffList?.filter((s: { status: string }) => s.status === "active").length || 0;

    const revenueData = useMemo(() =>
        Array.from({ length: 7 }, (_, i) => ({
            day: format(subDays(new Date(), 6 - i), "EEE"),
            revenue: 1000 + ((i * 397 + 1231) % 3000),
            labour: 400 + ((i * 173 + 541) % 1000),
        })),
        []);

    const unreadInsights = insights?.filter((i) => !i.is_read).length || 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Command Centre</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Week of {format(startOfWeek(new Date(), { weekStartsOn: 1 }), "dd MMM yyyy")}
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Weekly Revenue"
                    value={pnlLoading ? "..." : `€${(pnl?.revenue || 0).toLocaleString("en-IE", { minimumFractionDigits: 2 })}`}
                    subtitle={`${pnl?.transaction_count || 0} transactions`}
                    icon={ShoppingCart}
                    color="gold"
                    trend="up"
                    trendValue="+12%"
                />
                <KpiCard
                    title="Labour Cost"
                    value={pnlLoading ? "..." : `${pnl?.labour_cost_pct || 0}%`}
                    subtitle={`€${(pnl?.labour_cost || 0).toLocaleString("en-IE", { minimumFractionDigits: 2 })}`}
                    icon={Clock}
                    color={(pnl?.labour_cost_pct || 0) > 35 ? "red" : "green"}
                    trend={(pnl?.labour_cost_pct || 0) > 35 ? "up" : "down"}
                    trendValue={`${pnl?.labour_cost_pct || 0}% of revenue`}
                />
                <KpiCard
                    title="Gross Margin"
                    value={pnlLoading ? "..." : `€${(pnl?.gross_margin_estimate || 0).toLocaleString("en-IE", { minimumFractionDigits: 2 })}`}
                    subtitle="Est. after labour"
                    icon={TrendingUp}
                    color="green"
                />
                <KpiCard
                    title="Active Staff"
                    value={`${staffActive}/${staffTotal}`}
                    subtitle="Staff on record"
                    icon={Users}
                    color="blue"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#16213E] border border-white/10 rounded-xl p-6">
                    <h2 className="text-base font-semibold text-white mb-6">Revenue vs Labour — Last 7 Days</h2>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="labourGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `€${v}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#16213E", border: "1px solid #ffffff20", borderRadius: "8px" }}
                                labelStyle={{ color: "#fff" }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} fill="url(#revenueGrad)" name="revenue" />
                            <Area type="monotone" dataKey="labour" stroke="#60a5fa" strokeWidth={2} fill="url(#labourGrad)" name="labour" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-[#16213E] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-[#C9A84C]" />
                            <h2 className="text-base font-semibold text-white">AI Insights</h2>
                        </div>
                        {unreadInsights > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A84C]/20 text-[#C9A84C] font-medium">
                                {unreadInsights} new
                            </span>
                        )}
                    </div>
                    <div className="space-y-3 overflow-y-auto max-h-64">
                        {insightsLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
                                ))}
                            </div>
                        ) : insights && insights.length > 0 ? (
                            insights.map((insight) => (
                                <InsightCard key={insight.id} insight={insight} />
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <Brain className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No insights yet</p>
                                <p className="text-xs text-gray-600 mt-1">AI briefings run every Monday</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-[#16213E] border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Coins className="w-4 h-4 text-[#C9A84C]" />
                        <h3 className="text-sm font-semibold text-white">Avg Transaction</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">€{(pnl?.avg_transaction || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Per transaction this week</p>
                </div>

                <div className="bg-[#16213E] border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-semibold text-white">Compliance Alerts</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {insights?.filter((i) => i.insight_type === "compliance_alert" && !i.is_read).length || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Unresolved items</p>
                </div>

                <div className="bg-[#16213E] border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-semibold text-white">Labour Target</h3>
                    </div>
                    <p className={cn(
                        "text-3xl font-bold",
                        (pnl?.labour_cost_pct || 0) <= 30 ? "text-emerald-400" :
                            (pnl?.labour_cost_pct || 0) <= 35 ? "text-amber-400" : "text-red-400"
                    )}>
                        {(pnl?.labour_cost_pct || 0) <= 35 ? "On Track" : "Over"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Target: under 35% of revenue</p>
                </div>
            </div>
        </div>
    );
}