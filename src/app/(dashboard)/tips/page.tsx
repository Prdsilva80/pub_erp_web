"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format, startOfWeek, addDays, subWeeks, addWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Coins, Plus, ChevronLeft, ChevronRight,
    CheckCircle, Users, TrendingUp, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface TipRecord {
    id: string;
    total_amount: number;
    collection_date: string;
    is_distributed: boolean;
    distributed_at?: string;
    notes?: string;
}

interface Staff {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    status: string;
}

interface CollectTipsForm {
    total_amount: string;
    collection_date: string;
    notes: string;
}

function CollectTipsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<CollectTipsForm>({
        total_amount: "",
        collection_date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
    });

    const update = (field: keyof CollectTipsForm, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const { mutate: collectTips, isPending } = useMutation({
        mutationFn: async (data: CollectTipsForm) => {
            const { data: res } = await api.post("/tips/collect", {
                total_amount: parseFloat(data.total_amount),
                collection_date: data.collection_date,
                notes: data.notes,
            });
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tips"] });
            toast.success("Tips recorded successfully");
            onClose();
        },
        onError: () => toast.error("Failed to record tips"),
    });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#16213E] border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white">Record Tips Collection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Total Tips Amount (€)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={form.total_amount}
                            onChange={(e) => update("total_amount", e.target.value)}
                            className="bg-white/5 border-white/10 text-white text-lg font-bold"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Collection Date</Label>
                        <Input
                            type="date"
                            value={form.collection_date}
                            onChange={(e) => update("collection_date", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Notes (optional)</Label>
                        <Input
                            value={form.notes}
                            onChange={(e) => update("notes", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="e.g. Friday night service"
                        />
                    </div>
                    <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-3">
                        <p className="text-xs text-blue-300 font-medium mb-1">Tips Act 2022 Compliance</p>
                        <p className="text-xs text-blue-400/80">
                            Tips will be distributed fairly among eligible staff based on hours worked,
                            in compliance with the Payment of Wages (Amendment) (Tips and Gratuities) Act 2022.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={onClose} className="border-white/10 text-gray-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => collectTips(form)}
                        disabled={isPending || !form.total_amount}
                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                    >
                        {isPending ? "Recording..." : "Record Tips"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function TipsPage() {
    const queryClient = useQueryClient();
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [showCollect, setShowCollect] = useState(false);

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, "yyyy-MM-dd");
    const weekEndStr = format(addDays(weekStart, 6), "yyyy-MM-dd");

    const { data: tips = [], isLoading } = useQuery<TipRecord[]>({
        queryKey: ["tips", weekStartStr],
        queryFn: async () => {
            const { data } = await api.get(`/tips/?week_start=${weekStartStr}&week_end=${weekEndStr}`);
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

    const { mutate: distributeTips, isPending: distributing } = useMutation({
        mutationFn: async (tipId: string) => {
            await api.post(`/tips/${tipId}/distribute`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tips"] });
            toast.success("Tips distributed to staff");
        },
        onError: () => toast.error("Failed to distribute tips"),
    });

    const totalCollected = tips.reduce((acc, t) => acc + Number(t.total_amount), 0);
    const totalDistributed = tips.filter((t) => t.is_distributed).reduce((acc, t) => acc + Number(t.total_amount), 0);
    const pendingDistribution = tips.filter((t) => !t.is_distributed).reduce((acc, t) => acc + Number(t.total_amount), 0);
    const undistributedCount = tips.filter((t) => !t.is_distributed).length;
    const activeStaffCount = staffList.filter((s) => s.status === "active").length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Tips</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Tips Act 2022 compliant distribution
                        {undistributedCount > 0 && (
                            <span className="ml-2 text-amber-400">· {undistributedCount} pending distribution</span>
                        )}
                    </p>
                </div>
                <Button
                    onClick={() => setShowCollect(true)}
                    className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Record Tips
                </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Collected", value: `€${totalCollected.toFixed(2)}`, icon: Coins, color: "text-[#C9A84C] bg-[#C9A84C]/10" },
                    { label: "Distributed", value: `€${totalDistributed.toFixed(2)}`, icon: CheckCircle, color: "text-emerald-400 bg-emerald-400/10" },
                    { label: "Pending", value: `€${pendingDistribution.toFixed(2)}`, icon: AlertCircle, color: "text-amber-400 bg-amber-400/10" },
                    { label: "Eligible Staff", value: activeStaffCount.toString(), icon: Users, color: "text-blue-400 bg-blue-400/10" },
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

            <div className="bg-[#16213E] border border-[#C9A84C]/20 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-[#C9A84C]">Tips & Gratuities Act 2022</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Under Irish law, all tips and service charges must be distributed fairly to employees.
                            PubERP automatically calculates fair distribution based on hours worked during the relevant period.
                            Employers cannot retain tips for business costs. All distributions are logged for compliance audit purposes.
                        </p>
                    </div>
                </div>
            </div>

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

            <div className="bg-[#16213E] border border-white/10 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : tips.length === 0 ? (
                    <div className="p-12 text-center">
                        <Coins className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No tips recorded this week</p>
                        <p className="text-gray-600 text-sm mt-1">Record tips collected during service</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {tips.map((tip) => (
                            <div key={tip.id} className="px-6 py-4 flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                    tip.is_distributed ? "bg-emerald-400/10" : "bg-amber-400/10"
                                )}>
                                    <Coins className={cn("w-5 h-5", tip.is_distributed ? "text-emerald-400" : "text-amber-400")} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-white">€{Number(tip.total_amount).toFixed(2)}</p>
                                        {tip.is_distributed ? (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                                                Distributed
                                            </span>
                                        ) : (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Collected {format(new Date(tip.collection_date), "EEEE dd MMM yyyy")}
                                        {tip.notes && ` · ${tip.notes}`}
                                    </p>
                                    {tip.is_distributed && tip.distributed_at && (
                                        <p className="text-xs text-emerald-400/70 mt-0.5">
                                            Distributed {format(new Date(tip.distributed_at), "dd MMM, HH:mm")}
                                        </p>
                                    )}
                                </div>
                                {!tip.is_distributed && (
                                    <Button
                                        size="sm"
                                        onClick={() => distributeTips(tip.id)}
                                        disabled={distributing}
                                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold text-xs"
                                    >
                                        Distribute
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CollectTipsDialog open={showCollect} onClose={() => setShowCollect(false)} />
        </div>
    );
}