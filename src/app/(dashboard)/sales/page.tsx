"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
    ShoppingCart, TrendingUp, CreditCard,
    Banknote, Plus, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface Transaction {
    id: string;
    amount: number;
    transaction_type: string;
    payment_method: string;
    transaction_time: string;
    staff_id?: string;
    notes?: string;
}

interface DailySummary {
    date: string;
    total_revenue: number;
    transaction_count: number;
    avg_transaction: number;
    cash_total: number;
    card_total: number;
}

interface CreateTransactionForm {
    amount: string;
    transaction_type: string;
    payment_method: string;
    notes: string;
}

// ── Create Transaction Dialog ──────────────────────────────────────────────

function CreateTransactionDialog({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<CreateTransactionForm>({
        amount: "",
        transaction_type: "food_beverage",
        payment_method: "card",
        notes: "",
    });

    const update = (field: keyof CreateTransactionForm, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const { mutate: createTransaction, isPending } = useMutation({
        mutationFn: async (data: CreateTransactionForm) => {
            const { data: res } = await api.post("/transactions/", {
                amount: parseFloat(data.amount),
                transaction_type: data.transaction_type,
                payment_method: data.payment_method,
                notes: data.notes,
                transaction_time: new Date().toISOString(),
            });
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["daily-summary"] });
            toast.success("Transaction recorded");
            onClose();
        },
        onError: () => toast.error("Failed to record transaction"),
    });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#16213E] border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white">Record Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Amount (€)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={form.amount}
                            onChange={(e) => update("amount", e.target.value)}
                            className="bg-white/5 border-white/10 text-white text-lg font-bold"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs">Type</Label>
                            <Select value={form.transaction_type} onValueChange={(v) => update("transaction_type", v)}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#16213E] border-white/10">
                                    {["food_beverage", "accommodation", "entertainment", "other"].map((t) => (
                                        <SelectItem key={t} value={t} className="text-white hover:bg-white/10">
                                            {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs">Payment Method</Label>
                            <Select value={form.payment_method} onValueChange={(v) => update("payment_method", v)}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#16213E] border-white/10">
                                    {["card", "cash", "contactless", "voucher"].map((m) => (
                                        <SelectItem key={m} value={m} className="text-white hover:bg-white/10">
                                            {m.replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Notes (optional)</Label>
                        <Input
                            value={form.notes}
                            onChange={(e) => update("notes", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="e.g. Table 5 food order"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={onClose} className="border-white/10 text-gray-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => createTransaction(form)}
                        disabled={isPending || !form.amount}
                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                    >
                        {isPending ? "Recording..." : "Record Transaction"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function SalesPage() {
    const [showCreate, setShowCreate] = useState(false);
    const [dateFilter, setDateFilter] = useState("today");

    const getDateRange = () => {
        const now = new Date();
        switch (dateFilter) {
            case "today":
                return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() };
            case "yesterday":
                return { start: startOfDay(subDays(now, 1)).toISOString(), end: endOfDay(subDays(now, 1)).toISOString() };
            case "7days":
                return { start: startOfDay(subDays(now, 7)).toISOString(), end: endOfDay(now).toISOString() };
            case "30days":
                return { start: startOfDay(subDays(now, 30)).toISOString(), end: endOfDay(now).toISOString() };
            default:
                return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() };
        }
    };

    const { start, end } = getDateRange();

    const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
        queryKey: ["transactions", dateFilter],
        queryFn: async () => {
            const { data } = await api.get(`/transactions/?start=${start}&end=${end}&limit=100`);
            return data;
        },
        refetchInterval: 30000,
    });

    const { data: dailySummaries = [] } = useQuery<DailySummary[]>({
        queryKey: ["daily-summary", dateFilter],
        queryFn: async () => {
            const { data } = await api.get(`/transactions/daily-summary?start=${start}&end=${end}`);
            return Array.isArray(data) ? data : [data];
        },
    });

    const totalRevenue = transactions.reduce((acc, t) => acc + Number(t.amount), 0);
    const cashTotal = transactions.filter((t) => t.payment_method === "cash").reduce((acc, t) => acc + Number(t.amount), 0);
    const cardTotal = transactions.filter((t) => t.payment_method !== "cash").reduce((acc, t) => acc + Number(t.amount), 0);
    const avgTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;

    const chartData = dailySummaries.map((d) => ({
        date: format(new Date(d.date), "dd MMM"),
        revenue: Number(d.total_revenue),
        transactions: d.transaction_count,
    }));

    const paymentBreakdown = ["card", "cash", "contactless", "voucher"].map((method) => {
        const methodTotal = transactions
            .filter((t) => t.payment_method === method)
            .reduce((acc, t) => acc + Number(t.amount), 0);
        const pct = totalRevenue > 0 ? (methodTotal / totalRevenue) * 100 : 0;
        return { method, total: methodTotal, pct };
    }).filter((p) => p.total > 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Sales</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {transactions.length} transactions · €{totalRevenue.toFixed(2)} revenue
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#16213E] border-white/10">
                            <SelectItem value="today" className="text-white">Today</SelectItem>
                            <SelectItem value="yesterday" className="text-white">Yesterday</SelectItem>
                            <SelectItem value="7days" className="text-white">Last 7 Days</SelectItem>
                            <SelectItem value="30days" className="text-white">Last 30 Days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Record Sale
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Revenue", value: `€${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: "text-[#C9A84C] bg-[#C9A84C]/10" },
                    { label: "Transactions", value: transactions.length.toString(), icon: ShoppingCart, color: "text-blue-400 bg-blue-400/10" },
                    { label: "Card Payments", value: `€${cardTotal.toFixed(2)}`, icon: CreditCard, color: "text-emerald-400 bg-emerald-400/10" },
                    { label: "Cash Payments", value: `€${cashTotal.toFixed(2)}`, icon: Banknote, color: "text-amber-400 bg-amber-400/10" },
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

            {/* Chart + Payment Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#16213E] border border-white/10 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-4">Revenue Over Period</h2>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `€${v}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#16213E", border: "1px solid #ffffff20", borderRadius: "8px" }}
                                    labelStyle={{ color: "#fff" }}
                                />
                                <Bar dataKey="revenue" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Revenue" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-52 flex items-center justify-center">
                            <p className="text-gray-500 text-sm">No data for this period</p>
                        </div>
                    )}
                </div>

                <div className="bg-[#16213E] border border-white/10 rounded-xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-4">Payment Methods</h2>
                    {paymentBreakdown.length === 0 ? (
                        <div className="flex items-center justify-center h-40">
                            <p className="text-gray-500 text-sm">No transactions yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {paymentBreakdown.map(({ method, total, pct }) => (
                                <div key={method}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-300 capitalize">{method}</span>
                                        <span className="text-sm font-medium text-white">€{total.toFixed(2)}</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#C9A84C] rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{pct.toFixed(1)}% of revenue</p>
                                </div>
                            ))}
                            <div className="pt-3 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-300">Avg Transaction</span>
                                    <span className="text-sm font-bold text-[#C9A84C]">€{avgTransaction.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction List */}
            <div className="bg-[#16213E] border border-white/10 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
                    <Filter className="w-4 h-4 text-gray-500" />
                </div>

                {isLoading ? (
                    <div className="p-8 space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="p-12 text-center">
                        <ShoppingCart className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No transactions yet</p>
                        <p className="text-gray-600 text-sm mt-1">Record your first sale or connect your POS</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {transactions.slice(0, 20).map((t) => (
                            <div key={t.id} className="px-6 py-3 flex items-center gap-4 hover:bg-white/3 transition-colors">
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                    t.payment_method === "cash" ? "bg-amber-400/10" : "bg-[#C9A84C]/10"
                                )}>
                                    {t.payment_method === "cash"
                                        ? <Banknote className="w-4 h-4 text-amber-400" />
                                        : <CreditCard className="w-4 h-4 text-[#C9A84C]" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium capitalize">
                                        {(t.transaction_type ?? "sale").replace(/_/g, " ")}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(t.transaction_time), "dd MMM, HH:mm")} · {t.payment_method}
                                        {t.notes && ` · ${t.notes}`}
                                    </p>
                                </div>
                                <p className="text-sm font-bold text-white">€{Number(t.amount).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateTransactionDialog open={showCreate} onClose={() => setShowCreate(false)} />
        </div>
    );
}