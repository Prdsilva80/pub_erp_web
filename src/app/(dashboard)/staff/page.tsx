"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    Users, Plus, Search, AlertTriangle,
    CheckCircle, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface Staff {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: string;
    contract_type: string;
    hourly_rate: number;
    status: "active" | "inactive" | "suspended";
    start_date: string;
    rsa_certified: boolean;
    rsa_expiry?: string;
    work_permit_expiry?: string;
}

interface CreateStaffForm {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    contract_type: string;
    hourly_rate: string;
    start_date: string;
    weekly_contracted_hours: string;
}

// ── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Staff["status"] }) {
    const config = {
        active: { label: "Active", class: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
        inactive: { label: "Inactive", class: "bg-gray-400/10 text-gray-400 border-gray-400/20" },
        suspended: { label: "Suspended", class: "bg-red-400/10 text-red-400 border-red-400/20" },
    };
    const c = config[status];
    return (
        <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", c.class)}>
            {c.label}
        </span>
    );
}

// ── Compliance Indicator ───────────────────────────────────────────────────

function ComplianceIndicator({ staff }: { staff: Staff }) {
    const today = new Date();
    const rsaExpiry = staff.rsa_expiry ? new Date(staff.rsa_expiry) : null;
    const permitExpiry = staff.work_permit_expiry ? new Date(staff.work_permit_expiry) : null;
    const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const rsaAlert = rsaExpiry && rsaExpiry <= thirtyDays;
    const permitAlert = permitExpiry && permitExpiry <= thirtyDays;

    if (!rsaAlert && !permitAlert) {
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
    return (
        <div className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-400">
                {[rsaAlert && "RSA", permitAlert && "Permit"].filter(Boolean).join(", ")}
            </span>
        </div>
    );
}

// ── Create Staff Dialog ────────────────────────────────────────────────────

function CreateStaffDialog({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<CreateStaffForm>({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "bar_staff",
        contract_type: "full_time",
        hourly_rate: "13.50",
        start_date: format(new Date(), "yyyy-MM-dd"),
        weekly_contracted_hours: "39",
    });

    const { mutate: createStaff, isPending } = useMutation({
        mutationFn: async (data: CreateStaffForm) => {
            const { data: res } = await api.post("/staff/", {
                ...data,
                hourly_rate: parseFloat(data.hourly_rate),
                weekly_contracted_hours: parseFloat(data.weekly_contracted_hours),
            });
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff"] });
            toast.success("Staff member created successfully");
            onClose();
        },
        onError: () => {
            toast.error("Failed to create staff member");
        },
    });

    const update = (field: keyof CreateStaffForm, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#16213E] border-white/10 text-white max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-white">Add Staff Member</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">First Name</Label>
                        <Input
                            value={form.first_name}
                            onChange={(e) => update("first_name", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="Seán"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Last Name</Label>
                        <Input
                            value={form.last_name}
                            onChange={(e) => update("last_name", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="Murphy"
                        />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                        <Label className="text-gray-300 text-xs">Email</Label>
                        <Input
                            type="email"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="sean@example.ie"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Phone</Label>
                        <Input
                            value={form.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="+353 87 123 4567"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Start Date</Label>
                        <Input
                            type="date"
                            value={form.start_date}
                            onChange={(e) => update("start_date", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Role</Label>
                        <Select value={form.role} onValueChange={(v) => update("role", v)}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#16213E] border-white/10">
                                {["bar_staff", "bartender", "manager", "chef", "kitchen_staff", "floor_staff", "security", "cleaner"].map((r) => (
                                    <SelectItem key={r} value={r} className="text-white hover:bg-white/10">
                                        {r.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Contract Type</Label>
                        <Select value={form.contract_type} onValueChange={(v) => update("contract_type", v)}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#16213E] border-white/10">
                                {["full_time", "part_time", "casual", "zero_hours"].map((c) => (
                                    <SelectItem key={c} value={c} className="text-white hover:bg-white/10">
                                        {c.replace("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Hourly Rate (€)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={form.hourly_rate}
                            onChange={(e) => update("hourly_rate", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Weekly Hours</Label>
                        <Input
                            type="number"
                            value={form.weekly_contracted_hours}
                            onChange={(e) => update("weekly_contracted_hours", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-white/10 text-gray-400 hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => createStaff(form)}
                        disabled={isPending || !form.first_name || !form.email}
                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                    >
                        {isPending ? "Creating..." : "Add Staff Member"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Staff Row ──────────────────────────────────────────────────────────────

function StaffRow({ staff }: { staff: Staff }) {
    const queryClient = useQueryClient();

    const { mutate: updateStatus } = useMutation({
        mutationFn: async ({ status, reason }: { status: string; reason: string }) => {
            await api.patch(`/staff/${staff.id}/status?new_status=${status}&reason=${reason}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staff"] });
            toast.success("Status updated");
        },
    });

    return (
        <tr className="border-b border-white/5 hover:bg-white/3 transition-colors group">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#C9A84C] text-xs font-bold">
                            {staff.first_name[0]}{staff.last_name[0]}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">
                            {staff.first_name} {staff.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{staff.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <p className="text-sm text-gray-300 capitalize">
                    {staff.role.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                    {staff.contract_type.replace(/_/g, " ")}
                </p>
            </td>
            <td className="px-4 py-3">
                <p className="text-sm text-white font-medium">€{Number(staff.hourly_rate).toFixed(2)}/hr</p>
            </td>
            <td className="px-4 py-3">
                <StatusBadge status={staff.status} />
            </td>
            <td className="px-4 py-3">
                <ComplianceIndicator staff={staff} />
            </td>
            <td className="px-4 py-3">
                <p className="text-xs text-gray-500">
                    {staff.start_date ? format(new Date(staff.start_date), "dd MMM yyyy") : "—"}
                </p>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {staff.status === "active" ? (
                        <button
                            onClick={() => updateStatus({ status: "inactive", reason: "Manual deactivation" })}
                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                        >
                            Deactivate
                        </button>
                    ) : (
                        <button
                            onClick={() => updateStatus({ status: "active", reason: "Manual reactivation" })}
                            className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-400/10 transition-colors"
                        >
                            Activate
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function StaffPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [showCreate, setShowCreate] = useState(false);

    const { data: staffList = [], isLoading } = useQuery<Staff[]>({
        queryKey: ["staff"],
        queryFn: async () => {
            const { data } = await api.get("/staff/");
            return data;
        },
    });

    const filtered = staffList.filter((s) => {
        const matchSearch =
            `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || s.status === statusFilter;
        const matchRole = roleFilter === "all" || s.role === roleFilter;
        return matchSearch && matchStatus && matchRole;
    });

    const roles = [...new Set(staffList.map((s) => s.role))];
    const activeCount = staffList.filter((s) => s.status === "active").length;
    const complianceAlerts = staffList.filter((s) => {
        const today = new Date();
        const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const rsaExpiry = s.rsa_expiry ? new Date(s.rsa_expiry) : null;
        const permitExpiry = s.work_permit_expiry ? new Date(s.work_permit_expiry) : null;
        return (rsaExpiry && rsaExpiry <= thirtyDays) || (permitExpiry && permitExpiry <= thirtyDays);
    }).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Staff</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {activeCount} active · {staffList.length} total
                        {complianceAlerts > 0 && (
                            <span className="ml-2 text-amber-400">· {complianceAlerts} compliance alerts</span>
                        )}
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreate(true)}
                    className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Staff", value: staffList.length, icon: Users, color: "text-[#C9A84C]" },
                    { label: "Active", value: activeCount, icon: CheckCircle, color: "text-emerald-400" },
                    { label: "Inactive", value: staffList.filter((s) => s.status === "inactive").length, icon: XCircle, color: "text-gray-400" },
                    { label: "Compliance Alerts", value: complianceAlerts, icon: AlertTriangle, color: "text-amber-400" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-[#16213E] border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <Icon className={cn("w-5 h-5", color)} />
                            <div>
                                <p className="text-xl font-bold text-white">{value}</p>
                                <p className="text-xs text-gray-500">{label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Search staff..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#16213E] border-white/10">
                        <SelectItem value="all" className="text-white">All Status</SelectItem>
                        <SelectItem value="active" className="text-white">Active</SelectItem>
                        <SelectItem value="inactive" className="text-white">Inactive</SelectItem>
                        <SelectItem value="suspended" className="text-white">Suspended</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#16213E] border-white/10">
                        <SelectItem value="all" className="text-white">All Roles</SelectItem>
                        {roles.map((r) => (
                            <SelectItem key={r} value={r} className="text-white">
                                {r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="bg-[#16213E] border border-white/10 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
                            ))}
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No staff found</p>
                        <p className="text-gray-600 text-sm mt-1">
                            {search ? "Try adjusting your search" : "Add your first staff member"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/3">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((staff) => (
                                    <StaffRow key={staff.id} staff={staff} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreateStaffDialog open={showCreate} onClose={() => setShowCreate(false)} />
        </div>
    );
}