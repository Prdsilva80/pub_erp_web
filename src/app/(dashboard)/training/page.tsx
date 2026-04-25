"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    GraduationCap, Plus, CheckCircle, Clock,
    AlertCircle, BookOpen, Users, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface TrainingModule {
    id: string;
    title: string;
    description?: string;
    category: string;
    duration_minutes: number;
    is_mandatory: boolean;
    is_active: boolean;
}

interface TrainingRecord {
    id: string;
    staff_id: string;
    module_id: string;
    status: "assigned" | "in_progress" | "completed" | "overdue";
    assigned_at: string;
    completed_at?: string;
    due_date?: string;
    score?: number;
}

interface Staff {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    status: string;
}

interface CreateModuleForm {
    title: string;
    description: string;
    category: string;
    duration_minutes: string;
    is_mandatory: boolean;
}

interface AssignTrainingForm {
    staff_id: string;
    module_id: string;
    due_date: string;
}

// ── Status Badge ───────────────────────────────────────────────────────────

function TrainingStatusBadge({ status }: { status: TrainingRecord["status"] }) {
    const config = {
        assigned: { label: "Assigned", class: "bg-blue-400/10 text-blue-400 border-blue-400/20" },
        in_progress: { label: "In Progress", class: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
        completed: { label: "Completed", class: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
        overdue: { label: "Overdue", class: "bg-red-400/10 text-red-400 border-red-400/20" },
    };
    const c = config[status];
    return (
        <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", c.class)}>
            {c.label}
        </span>
    );
}

// ── Create Module Dialog ───────────────────────────────────────────────────

function CreateModuleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<CreateModuleForm>({
        title: "",
        description: "",
        category: "compliance",
        duration_minutes: "30",
        is_mandatory: false,
    });

    const update = (field: keyof CreateModuleForm, value: string | boolean) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const { mutate: createModule, isPending } = useMutation({
        mutationFn: async (data: CreateModuleForm) => {
            const { data: res } = await api.post("/training/modules", {
                title: data.title,
                description: data.description,
                category: data.category,
                duration_minutes: parseInt(data.duration_minutes),
                is_mandatory: data.is_mandatory,
            });
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["training-modules"] });
            toast.success("Training module created");
            onClose();
        },
        onError: () => toast.error("Failed to create module"),
    });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#16213E] border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white">Create Training Module</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Title</Label>
                        <Input
                            value={form.title}
                            onChange={(e) => update("title", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="e.g. Responsible Serving of Alcohol"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Description</Label>
                        <Input
                            value={form.description}
                            onChange={(e) => update("description", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="Brief description of the module"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs">Category</Label>
                            <Select value={form.category} onValueChange={(v) => update("category", v)}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#16213E] border-white/10">
                                    {["compliance", "safety", "service", "food_hygiene", "fire_safety", "gdpr", "onboarding"].map((c) => (
                                        <SelectItem key={c} value={c} className="text-white hover:bg-white/10">
                                            {c.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs">Duration (mins)</Label>
                            <Input
                                type="number"
                                value={form.duration_minutes}
                                onChange={(e) => update("duration_minutes", e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <input
                            type="checkbox"
                            id="mandatory"
                            checked={form.is_mandatory}
                            onChange={(e) => update("is_mandatory", e.target.checked)}
                            className="w-4 h-4 accent-[#C9A84C]"
                        />
                        <div>
                            <Label htmlFor="mandatory" className="text-sm text-white cursor-pointer">
                                Mandatory Training
                            </Label>
                            <p className="text-xs text-gray-500">Required for all active staff members</p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={onClose} className="border-white/10 text-gray-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => createModule(form)}
                        disabled={isPending || !form.title}
                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                    >
                        {isPending ? "Creating..." : "Create Module"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Assign Training Dialog ─────────────────────────────────────────────────

function AssignTrainingDialog({
    open,
    onClose,
    modules,
    staffList,
}: {
    open: boolean;
    onClose: () => void;
    modules: TrainingModule[];
    staffList: Staff[];
}) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<AssignTrainingForm>({
        staff_id: "",
        module_id: "",
        due_date: "",
    });

    const update = (field: keyof AssignTrainingForm, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const { mutate: assignTraining, isPending } = useMutation({
        mutationFn: async (data: AssignTrainingForm) => {
            const { data: res } = await api.post("/training/assign", {
                staff_id: data.staff_id,
                module_id: data.module_id,
                due_date: data.due_date || null,
            });
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["training-records"] });
            toast.success("Training assigned successfully");
            onClose();
        },
        onError: () => toast.error("Failed to assign training"),
    });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#16213E] border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white">Assign Training</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Staff Member</Label>
                        <Select value={form.staff_id} onValueChange={(v) => update("staff_id", v)}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#16213E] border-white/10">
                                {staffList.filter((s) => s.status === "active").map((s) => (
                                    <SelectItem key={s.id} value={s.id} className="text-white hover:bg-white/10">
                                        {s.first_name} {s.last_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Training Module</Label>
                        <Select value={form.module_id} onValueChange={(v) => update("module_id", v)}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Select module" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#16213E] border-white/10">
                                {modules.filter((m) => m.is_active).map((m) => (
                                    <SelectItem key={m.id} value={m.id} className="text-white hover:bg-white/10">
                                        {m.title} {m.is_mandatory && "⚡"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Due Date (optional)</Label>
                        <Input
                            type="date"
                            value={form.due_date}
                            onChange={(e) => update("due_date", e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={onClose} className="border-white/10 text-gray-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => assignTraining(form)}
                        disabled={isPending || !form.staff_id || !form.module_id}
                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                    >
                        {isPending ? "Assigning..." : "Assign Training"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function TrainingPage() {
    const [showCreateModule, setShowCreateModule] = useState(false);
    const [showAssign, setShowAssign] = useState(false);
    const [activeTab, setActiveTab] = useState<"modules" | "records">("modules");

    const { data: modules = [], isLoading: modulesLoading } = useQuery<TrainingModule[]>({
        queryKey: ["training-modules"],
        queryFn: async () => {
            const { data } = await api.get("/training/modules");
            return data;
        },
    });

    const { data: records = [], isLoading: recordsLoading } = useQuery<TrainingRecord[]>({
        queryKey: ["training-records"],
        queryFn: async () => {
            const { data } = await api.get("/training/records");
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

    const getStaffName = (staffId: string) => {
        const s = staffList.find((s) => s.id === staffId);
        return s ? `${s.first_name} ${s.last_name}` : "Unknown";
    };

    const getModuleTitle = (moduleId: string) => {
        const m = modules.find((m) => m.id === moduleId);
        return m?.title || "Unknown";
    };

    const completedCount = records.filter((r) => r.status === "completed").length;
    const overdueCount = records.filter((r) => r.status === "overdue").length;
    const mandatoryModules = modules.filter((m) => m.is_mandatory).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Training</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {modules.length} modules · {completedCount} completed
                        {overdueCount > 0 && (
                            <span className="ml-2 text-red-400">· {overdueCount} overdue</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowAssign(true)}
                        className="border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Assign Training
                    </Button>
                    <Button
                        onClick={() => setShowCreateModule(true)}
                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Module
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Modules", value: modules.length.toString(), icon: BookOpen, color: "text-[#C9A84C] bg-[#C9A84C]/10" },
                    { label: "Mandatory", value: mandatoryModules.toString(), icon: AlertCircle, color: "text-amber-400 bg-amber-400/10" },
                    { label: "Completed", value: completedCount.toString(), icon: CheckCircle, color: "text-emerald-400 bg-emerald-400/10" },
                    { label: "Overdue", value: overdueCount.toString(), icon: Clock, color: overdueCount > 0 ? "text-red-400 bg-red-400/10" : "text-gray-400 bg-gray-400/10" },
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

            {/* Tabs */}
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1 w-fit">
                {(["modules", "records"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-4 py-1.5 rounded text-sm font-medium transition-all capitalize",
                            activeTab === tab
                                ? "bg-[#C9A84C] text-[#1A1A2E]"
                                : "text-gray-400 hover:text-white"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Modules Tab */}
            {activeTab === "modules" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {modulesLoading ? (
                        [1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
                        ))
                    ) : modules.length === 0 ? (
                        <div className="col-span-2 p-12 text-center bg-[#16213E] border border-white/10 rounded-xl">
                            <GraduationCap className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No training modules yet</p>
                            <p className="text-gray-600 text-sm mt-1">Create your first module to get started</p>
                        </div>
                    ) : (
                        modules.map((module) => (
                            <div
                                key={module.id}
                                className="bg-[#16213E] border border-white/10 rounded-xl p-5 hover:border-[#C9A84C]/30 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center",
                                            module.is_mandatory ? "bg-amber-400/10" : "bg-[#C9A84C]/10"
                                        )}>
                                            {module.is_mandatory
                                                ? <AlertCircle className="w-4 h-4 text-amber-400" />
                                                : <BookOpen className="w-4 h-4 text-[#C9A84C]" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{module.title}</p>
                                            <p className="text-xs text-gray-500 capitalize">
                                                {module.category.replace(/_/g, " ")}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {module.is_mandatory && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                                                Mandatory
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {module.description && (
                                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{module.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {module.duration_minutes} mins
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Award className="w-3 h-3" />
                                        {records.filter((r) => r.module_id === module.id && r.status === "completed").length} completed
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Records Tab */}
            {activeTab === "records" && (
                <div className="bg-[#16213E] border border-white/10 rounded-xl overflow-hidden">
                    {recordsLoading ? (
                        <div className="p-8 space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : records.length === 0 ? (
                        <div className="p-12 text-center">
                            <GraduationCap className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No training records yet</p>
                            <p className="text-gray-600 text-sm mt-1">Assign training to staff members to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/3">
                                        {["Staff Member", "Module", "Status", "Assigned", "Due Date", "Completed"].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((record) => (
                                        <tr key={record.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-white">{getStaffName(record.staff_id)}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-gray-300">{getModuleTitle(record.module_id)}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <TrainingStatusBadge status={record.status} />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {format(new Date(record.assigned_at), "dd MMM yyyy")}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {record.due_date ? format(new Date(record.due_date), "dd MMM yyyy") : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {record.completed_at ? format(new Date(record.completed_at), "dd MMM yyyy") : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <CreateModuleDialog open={showCreateModule} onClose={() => setShowCreateModule(false)} />
            <AssignTrainingDialog
                open={showAssign}
                onClose={() => setShowAssign(false)}
                modules={modules}
                staffList={staffList}
            />
        </div>
    );
}