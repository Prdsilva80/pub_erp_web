"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Brain, TrendingUp, AlertTriangle, Info,
    CheckCircle, RefreshCw, ChevronDown, ChevronUp,
    Zap, BarChart2, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface AIInsight {
    id: string;
    insight_type: string;
    severity: "info" | "warning" | "critical";
    title: string;
    content: string;
    action_label?: string;
    confidence_score?: number;
    is_read: boolean;
    created_at: string;
}

// ── Insight Card ───────────────────────────────────────────────────────────

function InsightCard({
    insight,
    onMarkRead,
}: {
    insight: AIInsight;
    onMarkRead: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);

    const severityConfig = {
        info: {
            border: "border-blue-400/20",
            bg: "bg-blue-400/5",
            icon: Info,
            iconColor: "text-blue-400",
            badge: "bg-blue-400/10 text-blue-400 border-blue-400/20",
        },
        warning: {
            border: "border-amber-400/20",
            bg: "bg-amber-400/5",
            icon: AlertTriangle,
            iconColor: "text-amber-400",
            badge: "bg-amber-400/10 text-amber-400 border-amber-400/20",
        },
        critical: {
            border: "border-red-400/20",
            bg: "bg-red-400/5",
            icon: AlertTriangle,
            iconColor: "text-red-400",
            badge: "bg-red-400/10 text-red-400 border-red-400/20",
        },
    };

    const typeConfig: Record<string, { icon: React.ElementType; label: string }> = {
        revenue_forecast: { icon: TrendingUp, label: "Revenue Forecast" },
        compliance_alert: { icon: Shield, label: "Compliance Alert" },
        inventory_alert: { icon: AlertTriangle, label: "Inventory Alert" },
        weekly_briefing: { icon: Brain, label: "Weekly Briefing" },
        anomaly_detection: { icon: Zap, label: "Anomaly Detected" },
        staff_recommendation: { icon: CheckCircle, label: "Staff Insight" },
    };

    const config = severityConfig[insight.severity];
    const typeInfo = typeConfig[insight.insight_type] || { icon: Brain, label: insight.insight_type };
    const SeverityIcon = config.icon;
    const TypeIcon = typeInfo.icon;

    return (
        <div className={cn(
            "bg-[#16213E] border rounded-xl transition-all duration-200",
            config.border,
            !insight.is_read ? "shadow-lg" : "opacity-70"
        )}>
            <div
                className="p-5 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start gap-4">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                        <SeverityIcon className={cn("w-5 h-5", config.iconColor)} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                            <p className={cn(
                                "text-sm font-semibold",
                                insight.is_read ? "text-gray-300" : "text-white"
                            )}>
                                {insight.title}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {!insight.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-[#C9A84C]" />
                                )}
                                {expanded
                                    ? <ChevronUp className="w-4 h-4 text-gray-500" />
                                    : <ChevronDown className="w-4 h-4 text-gray-500" />
                                }
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full border", config.badge)}>
                                {insight.severity}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <TypeIcon className="w-3 h-3" />
                                {typeInfo.label}
                            </span>
                            {insight.confidence_score && (
                                <span className="text-xs text-gray-500">
                                    {Math.round(insight.confidence_score * 100)}% confidence
                                </span>
                            )}
                            <span className="text-xs text-gray-600">
                                {format(new Date(insight.created_at), "dd MMM, HH:mm")}
                            </span>
                        </div>

                        {!expanded && (
                            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{insight.content}</p>
                        )}
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="px-5 pb-5">
                    <div className={cn("rounded-lg p-4 mb-4", config.bg)}>
                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {insight.content}
                        </p>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {insight.action_label && (
                                <Button
                                    size="sm"
                                    className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold text-xs"
                                >
                                    {insight.action_label}
                                </Button>
                            )}
                        </div>
                        {!insight.is_read && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onMarkRead(insight.id); }}
                                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                Mark as read
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function AIInsightsPage() {
    const queryClient = useQueryClient();
    const [typeFilter, setTypeFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [showReadOnly, setShowReadOnly] = useState(false);

    const { data: insights = [], isLoading, refetch, isFetching } = useQuery<AIInsight[]>({
        queryKey: ["ai-insights"],
        queryFn: async () => {
            const { data } = await api.get("/ai/insights?limit=50");
            return data;
        },
        refetchInterval: 120000,
    });

    const { mutate: markRead } = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/ai/insights/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
        },
    });

    const { mutate: markAllRead, isPending: markingAll } = useMutation({
        mutationFn: async () => {
            await api.post("/ai/insights/mark-all-read");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
            toast.success("All insights marked as read");
        },
    });

    const { mutate: generateBriefing, isPending: generating } = useMutation({
        mutationFn: async () => {
            await api.post("/ai/generate-briefing");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
            toast.success("AI briefing generated");
        },
        onError: () => toast.error("Failed to generate briefing"),
    });

    const filtered = insights.filter((i) => {
        const matchType = typeFilter === "all" || i.insight_type === typeFilter;
        const matchSeverity = severityFilter === "all" || i.severity === severityFilter;
        const matchRead = showReadOnly ? true : !i.is_read || true;
        return matchType && matchSeverity && matchRead;
    });

    const unreadCount = insights.filter((i) => !i.is_read).length;
    const criticalCount = insights.filter((i) => i.severity === "critical" && !i.is_read).length;
    const warningCount = insights.filter((i) => i.severity === "warning" && !i.is_read).length;

    const insightTypes = [...new Set(insights.map((i) => i.insight_type))];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">AI Insights</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {unreadCount} unread
                        {criticalCount > 0 && <span className="ml-2 text-red-400">· {criticalCount} critical</span>}
                        {warningCount > 0 && <span className="ml-2 text-amber-400">· {warningCount} warnings</span>}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => markAllRead()}
                            disabled={markingAll}
                            className="border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark All Read
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => generateBriefing()}
                        disabled={generating}
                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                    >
                        <Brain className="w-4 h-4 mr-2" />
                        {generating ? "Generating..." : "Generate Briefing"}
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Insights", value: insights.length.toString(), icon: Brain, color: "text-[#C9A84C] bg-[#C9A84C]/10" },
                    { label: "Unread", value: unreadCount.toString(), icon: Info, color: "text-blue-400 bg-blue-400/10" },
                    { label: "Warnings", value: warningCount.toString(), icon: AlertTriangle, color: "text-amber-400 bg-amber-400/10" },
                    { label: "Critical", value: criticalCount.toString(), icon: Zap, color: criticalCount > 0 ? "text-red-400 bg-red-400/10" : "text-gray-400 bg-gray-400/10" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-[#16213E] border border-white/10 rounded-xl p-5">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", color)}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-bold text-white">{value}</p>
                        <p className="text-xs text-gray-500 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* AI Info Banner */}
            <div className="bg-[#16213E] border border-[#C9A84C]/20 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <BarChart2 className="w-5 h-5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-[#C9A84C]">PubERP Intelligence Engine</p>
                        <p className="text-xs text-gray-400 mt-1">
                            AI briefings are generated every Monday at 07:00 using Prophet forecasting, XGBoost anomaly detection,
                            and GPT-4o analysis. Insights cover revenue trends, labour efficiency, compliance risks,
                            inventory alerts, and operational recommendations specific to your venue.
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                    {["all", "info", "warning", "critical"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setSeverityFilter(s)}
                            className={cn(
                                "px-3 py-1.5 rounded text-xs font-medium transition-all capitalize",
                                severityFilter === s
                                    ? "bg-[#C9A84C] text-[#1A1A2E]"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                    {["all", ...insightTypes].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={cn(
                                "px-3 py-1.5 rounded text-xs font-medium transition-all",
                                typeFilter === t
                                    ? "bg-[#C9A84C] text-[#1A1A2E]"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            {t === "all" ? "All Types" : t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setShowReadOnly(!showReadOnly)}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        showReadOnly
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-transparent border-white/10 text-gray-400 hover:text-white"
                    )}
                >
                    {showReadOnly ? "Showing All" : "Unread Only"}
                </button>
            </div>

            {/* Insights List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-12 text-center bg-[#16213E] border border-white/10 rounded-xl">
                    <Brain className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No insights found</p>
                    <p className="text-gray-600 text-sm mt-1">
                        Generate a briefing or adjust filters to see insights
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered
                        .sort((a, b) => {
                            if (!a.is_read && b.is_read) return -1;
                            if (a.is_read && !b.is_read) return 1;
                            const severityOrder = { critical: 0, warning: 1, info: 2 };
                            return severityOrder[a.severity] - severityOrder[b.severity];
                        })
                        .map((insight) => (
                            <InsightCard
                                key={insight.id}
                                insight={insight}
                                onMarkRead={markRead}
                            />
                        ))}
                </div>
            )}
        </div>
    );
}