"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format, startOfWeek, addDays, subWeeks, addWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import {
    ChevronLeft, ChevronRight, Clock, CheckCircle,
    XCircle, AlertCircle, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface Timesheet {
    id: string;
    staff_id: string;
    clocked_in: string;
    clocked_out?: string;
    total_hours_worked?: number;
    total_pay?: number;
    status: "pending" | "approved" | "disputed";
    notes?: string;
}

interface Staff {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    hourly_rate: number;
}

// ── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Timesheet["status"] }) {
    const config = {
        pending: { label: "Pending", class: "bg-amber-400/10 text-amber-400 border-amber-400/20", icon: AlertCircle },
        approved: { label: "Approved", class: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20", icon: CheckCircle },
        disputed: { label: "Disputed", class: "bg-red-400/10 text-red-400 border-red-400/20", icon: XCircle },
    };
    const c = config[status];
    const Icon = c.icon;
    return (
        <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium w-fit", c.class)}>
            <Icon className="w-3 h-3" />
            {c.label}
        </span>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function TimesheetsPage() {
    const queryClient = useQueryClient();
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [statusFilter, setStatusFilter] = useState("all");

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, "yyyy-MM-dd");
    const weekEndStr = format(addDays(weekStart, 6), "yyyy-MM-dd");

    const { data: timesheets = [], isLoading } = useQuery<Timesheet[]>({
        queryKey: ["timesheets", weekStartStr],
        queryFn: async () => {
            const { data } = await api.get(`/timesheets/?week_start=${weekStartStr}&week_end=${weekEndStr}`);
            return data;
        },
    });

    const { data: staffList = [] } = useQuery<Staff[]>({
        queryKey: ["staff"],
        queryFn: async () => {
            const { data } = await api.get("/staff/");
            return data;
        },
    });

    const { mutate: approveTimesheet } = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/timesheets/${id}/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timesheets"] });
            toast.success("Timesheet approved");
        },
        onError: () => toast.error("Failed to approve timesheet"),
    });

    const { mutate: disputeTimesheet } = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/timesheets/${id}/dispute`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timesheets"] });
            toast.warning("Timesheet marked as disputed");
        },
        onError: () => toast.error("Failed to dispute timesheet"),
    });

    const { mutate: approveAll, isPending: approvingAll } = useMutation({
        mutationFn: async () => {
            const pending = timesheets.filter((t) => t.status === "pending");
            await Promise.all(pending.map((t) => api.patch(`/timesheets/${t.id}/approve`)));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timesheets"] });
            toast.success("All timesheets approved");
        },
    });

    const getStaff = (staffId: string) => staffList.find((s) => s.id === staffId);

    const filtered = timesheets.filter((t) =>
        statusFilter === "all" ? true : t.status === statusFilter
    );

    const totalHours = timesheets
        .filter((t) => t.status === "approved")
        .reduce((acc, t) => acc + (t.total_hours_worked || 0), 0);

    const totalPay = timesheets
        .filter((t) => t.status === "approved")
        .reduce((acc, t) => acc + (t.total_pay || 0), 0);

    const pendingCount = timesheets.filter((t) => t.status === "pending").length;

    const downloadPayroll = () => {
        window.open(
            `${process.env.NEXT_PUBLIC_API_URL}/finance/payroll-export?week_start=${weekStartStr}`,
            "_blank"
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Timesheets</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {pendingCount > 0 ? (
                            <span className="text-amber-400">{pendingCount} pending approval · </span>
                        ) : null}
                        {totalHours.toFixed(1)}h approved · €{totalPay.toFixed(2)} labour cost
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={downloadPayroll}
                        className="border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Payroll
                    </Button>
                    {pendingCount > 0 && (
                        <Button
                            onClick={() => approveAll()}
                            disabled={approvingAll}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {approvingAll ? "Approving..." : `Approve All (${pendingCount})`}
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Timesheets", value: timesheets.length, color: "text-[#C9A84C]" },
                    { label: "Pending", value: pendingCount, color: "text-amber-400" },
                    { label: "Approved Hours", value: `${totalHours.toFixed(1)}h`, color: "text-emerald-400" },
                    { label: "Labour Cost", value: `€${totalPay.toFixed(2)}`, color: "text-blue-400" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-[#16213E] border border-white/10 rounded-xl p-4">
                        <p className={cn("text-xl font-bold", color)}>{value}</p>
                        <p className="text-xs text-gray-500 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Week Navigator + Filter */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    <span className="text-sm font-medium text-white min-w-48 text-center">
                        {format(weekStart, "dd MMM")} — {format(addDays(weekStart, 6), "dd MMM yyyy")}
                    </span>
                    <button
                        onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#16213E] border-white/10">
                        <SelectItem value="all" className="text-white">All</SelectItem>
                        <SelectItem value="pending" className="text-white">Pending</SelectItem>
                        <SelectItem value="approved" className="text-white">Approved</SelectItem>
                        <SelectItem value="disputed" className="text-white">Disputed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-[#16213E] border border-white/10 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No timesheets this week</p>
                        <p className="text-gray-600 text-sm mt-1">Staff clock in via the attendance terminal</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/3">
                                    {["Staff Member", "Date", "Clocked In", "Clocked Out", "Hours", "Pay", "Status", "Actions"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((ts) => {
                                    const staff = getStaff(ts.staff_id);
                                    return (
                                        <tr key={ts.id} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                                                        <span className="text-[#C9A84C] text-xs font-bold">
                                                            {staff?.first_name?.[0]}{staff?.last_name?.[0]}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-white font-medium">
                                                            {staff?.first_name} {staff?.last_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 capitalize">
                                                            {staff?.role?.replace(/_/g, " ")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-300">
                                                {format(new Date(ts.clocked_in), "EEE dd MMM")}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-300">
                                                {format(new Date(ts.clocked_in), "HH:mm")}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-300">
                                                {ts.clocked_out ? format(new Date(ts.clocked_out), "HH:mm") : (
                                                    <span className="text-amber-400">Still clocked in</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-white font-medium">
                                                {ts.total_hours_worked ? `${ts.total_hours_worked.toFixed(2)}h` : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-white font-medium">
                                                {ts.total_pay ? `€${ts.total_pay.toFixed(2)}` : "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={ts.status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                {ts.status === "pending" && (
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => approveTimesheet(ts.id)}
                                                            className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-400/10 transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => disputeTimesheet(ts.id)}
                                                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                                                        >
                                                            Dispute
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}