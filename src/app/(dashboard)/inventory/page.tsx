"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    Package, Plus, AlertTriangle, Search,
    TrendingDown, CheckCircle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface InventoryItem {
    id: string;
    name: string;
    category: string;
    current_quantity: number;
    unit: string;
    reorder_threshold: number;
    supplier_name?: string;
    cost_per_unit?: number;
    is_active: boolean;
}

interface CreateItemForm {
    name: string;
    category: string;
    current_quantity: string;
    unit: string;
    reorder_threshold: string;
    supplier_name: string;
    cost_per_unit: string;
}

interface AdjustStockForm {
    quantity_change: string;
    reason: string;
    notes: string;
}

// ── Stock Level Bar ────────────────────────────────────────────────────────

function StockLevelBar({ current, threshold }: { current: number; threshold: number }) {
    const pct = threshold > 0 ? Math.min((current / (threshold * 2)) * 100, 100) : 100;
    const isLow = current <= threshold;
    const isCritical = current <= threshold * 0.5;

    return (
        <div className="w-24">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isCritical ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-emerald-400"
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className={cn(
                "text-xs mt-0.5",
                isCritical ? "text-red-400" : isLow ? "text-amber-400" : "text-gray-500"
            )}>
                {current} {isLow ? "⚠ low" : ""}
            </p>
        </div>
    );
}

// ── Create Item Dialog ─────────────────────────────────────────────────────

function CreateItemDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<CreateItemForm>({
        name: "",
        category: "beverages",
        current_quantity: "",
        unit: "units",
        reorder_threshold: "",
        supplier_name: "",
        cost_per_unit: "",
    });

    const update = (field: keyof CreateItemForm, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const { mutate: createItem, isPending } = useMutation({
        mutationFn: async (data: CreateItemForm) => {
            const { data: res } = await api.post("/inventory/", {
                name: data.name,
                category: data.category,
                current_quantity: parseFloat(data.current_quantity),
                unit: data.unit,
                reorder_threshold: parseFloat(data.reorder_threshold),
                supplier_name: data.supplier_name || null,
                cost_per_unit: data.cost_per_unit ? parseFloat(data.cost_per_unit) : null,
            });
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            toast.success("Item added to inventory");
            onClose();
        },
        onError: () => toast.error("Failed to add item"),
    });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#16213E] border-white/10 text-white max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-white">Add Inventory Item</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1.5 col-span-2">
                        <Label className="text-gray-300 text-xs">Item Name</Label>
                        <Input
                            value={form.name}
                            onChange={(e) => update("name", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="e.g. Guinness Draught Keg"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Category</Label>
                        <Select value={form.category} onValueChange={(v) => update("category", v)}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#16213E] border-white/10">
                                {["beverages", "spirits", "wine", "food", "cleaning", "disposables", "equipment"].map((c) => (
                                    <SelectItem key={c} value={c} className="text-white hover:bg-white/10">
                                        {c.replace(/\b\w/g, (ch) => ch.toUpperCase())}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Unit</Label>
                        <Select value={form.unit} onValueChange={(v) => update("unit", v)}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#16213E] border-white/10">
                                {["units", "kegs", "bottles", "cases", "litres", "kg", "boxes"].map((u) => (
                                    <SelectItem key={u} value={u} className="text-white hover:bg-white/10">{u}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Current Quantity</Label>
                        <Input
                            type="number"
                            value={form.current_quantity}
                            onChange={(e) => update("current_quantity", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Reorder Threshold</Label>
                        <Input
                            type="number"
                            value={form.reorder_threshold}
                            onChange={(e) => update("reorder_threshold", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="0"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Supplier</Label>
                        <Input
                            value={form.supplier_name}
                            onChange={(e) => update("supplier_name", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="e.g. Musgrave Wholesale"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Cost per Unit (€)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={form.cost_per_unit}
                            onChange={(e) => update("cost_per_unit", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={onClose} className="border-white/10 text-gray-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => createItem(form)}
                        disabled={isPending || !form.name || !form.current_quantity}
                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                    >
                        {isPending ? "Adding..." : "Add Item"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Adjust Stock Dialog ────────────────────────────────────────────────────

function AdjustStockDialog({
    open,
    onClose,
    item,
}: {
    open: boolean;
    onClose: () => void;
    item: InventoryItem | null;
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<AdjustStockForm>({
        quantity_change: "",
        reason: "restock",
        notes: "",
    });

    const update = (field: keyof AdjustStockForm, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const { mutate: adjustStock, isPending } = useMutation({
        mutationFn: async (data: AdjustStockForm) => {
            await api.post(`/inventory/${item?.id}/adjust`, {
                quantity_change: parseFloat(data.quantity_change),
                reason: data.reason,
                notes: data.notes,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory"] });
            toast.success("Stock adjusted");
            onClose();
        },
        onError: () => toast.error("Failed to adjust stock"),
    });

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#16213E] border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white">Adjust Stock — {item.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Current stock</p>
                        <p className="text-2xl font-bold text-white">{item.current_quantity} {item.unit}</p>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Quantity Change (use - to remove)</Label>
                        <Input
                            type="number"
                            value={form.quantity_change}
                            onChange={(e) => update("quantity_change", e.target.value)}
                            className="bg-white/5 border-white/10 text-white text-lg font-bold"
                            placeholder="+10 or -5"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Reason</Label>
                        <Select value={form.reason} onValueChange={(v) => update("reason", v)}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#16213E] border-white/10">
                                {["restock", "sale", "waste", "damage", "audit_correction", "transfer"].map((r) => (
                                    <SelectItem key={r} value={r} className="text-white hover:bg-white/10">
                                        {r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Notes (optional)</Label>
                        <Input
                            value={form.notes}
                            onChange={(e) => update("notes", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="e.g. Weekly delivery from Musgrave"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={onClose} className="border-white/10 text-gray-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => adjustStock(form)}
                        disabled={isPending || !form.quantity_change}
                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                    >
                        {isPending ? "Adjusting..." : "Adjust Stock"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function InventoryPage() {
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [showCreate, setShowCreate] = useState(false);
    const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);

    const { data: inventory = [], isLoading, refetch } = useQuery<InventoryItem[]>({
        queryKey: ["inventory"],
        queryFn: async () => {
            const { data } = await api.get("/inventory/");
            return data;
        },
    });

    const filtered = inventory.filter((item) => {
        const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.supplier_name?.toLowerCase().includes(search.toLowerCase());
        const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
        return matchSearch && matchCategory && item.is_active;
    });

    const lowStockItems = inventory.filter((i) => i.current_quantity <= i.reorder_threshold && i.is_active);
    const criticalItems = inventory.filter((i) => i.current_quantity <= i.reorder_threshold * 0.5 && i.is_active);
    const categories = [...new Set(inventory.map((i) => i.category))];

    const totalValue = inventory
        .filter((i) => i.is_active)
        .reduce((acc, i) => acc + (i.current_quantity * (i.cost_per_unit || 0)), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Inventory</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {inventory.filter((i) => i.is_active).length} items · €{totalValue.toFixed(2)} stock value
                        {lowStockItems.length > 0 && (
                            <span className="ml-2 text-amber-400">· {lowStockItems.length} low stock</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        className="border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Items", value: inventory.filter((i) => i.is_active).length.toString(), icon: Package, color: "text-[#C9A84C] bg-[#C9A84C]/10" },
                    { label: "Low Stock", value: lowStockItems.length.toString(), icon: TrendingDown, color: "text-amber-400 bg-amber-400/10" },
                    { label: "Critical", value: criticalItems.length.toString(), icon: AlertTriangle, color: "text-red-400 bg-red-400/10" },
                    { label: "Stock Value", value: `€${totalValue.toFixed(0)}`, icon: CheckCircle, color: "text-emerald-400 bg-emerald-400/10" },
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

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
                <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <p className="text-sm font-semibold text-amber-400">Low Stock Alert</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {lowStockItems.map((item) => (
                            <span
                                key={item.id}
                                className="text-xs px-2 py-1 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 cursor-pointer hover:bg-amber-400/20"
                                onClick={() => setAdjustItem(item)}
                            >
                                {item.name} ({item.current_quantity} {item.unit})
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Search inventory..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#16213E] border-white/10">
                        <SelectItem value="all" className="text-white">All Categories</SelectItem>
                        {categories.map((c) => (
                            <SelectItem key={c} value={c} className="text-white">
                                {c.replace(/\b\w/g, (ch) => ch.toUpperCase())}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-[#16213E] border border-white/10 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No inventory items found</p>
                        <p className="text-gray-600 text-sm mt-1">Add your first item to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/3">
                                    {["Item", "Category", "Stock Level", "Reorder At", "Supplier", "Cost/Unit", "Actions"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item) => (
                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/3 transition-colors group">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-white">{item.name}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 capitalize">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StockLevelBar current={item.current_quantity} threshold={item.reorder_threshold} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                            {item.reorder_threshold} {item.unit}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                            {item.supplier_name || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                            {item.cost_per_unit ? `€${Number(item.cost_per_unit).toFixed(2)}` : "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => setAdjustItem(item)}
                                                className="text-xs text-[#C9A84C] hover:text-[#B8963C] px-2 py-1 rounded hover:bg-[#C9A84C]/10 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                Adjust
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreateItemDialog open={showCreate} onClose={() => setShowCreate(false)} />
            <AdjustStockDialog
                open={!!adjustItem}
                onClose={() => setAdjustItem(null)}
                item={adjustItem}
            />
        </div>
    );
}