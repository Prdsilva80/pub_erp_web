"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
    ChevronLeft, ChevronRight, Plus, Calendar,
    Clock, CheckCircle, XCircle, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface Shift {
    id: string;
    staff_id: string;
    start_time: string;
    end_time: string;
    role: string;
    status: "draft" | "published" | "cancelled";
    notes?: string;
}

interface Staff {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    status: string;
}

interface CreateShiftForm {
    staff_id: string;
    start_time: string;
    end_time: string;
    role: string;
    notes: string;
}

// ── Shift Pill ─────────────────────────────────────────────────────────────

function ShiftPill({ shift, staffName }: { shift: Shift; staffName: string }) {
    const statusConfig = {
        draft: "bg-gray-500/20 text-gray-300 border-gray-500/30",
        published: "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30",
        cancelled: "bg-red-500/20 text-red-400 border-red-500/30 line-through opacity-50",
    };

    return (
        <div className={cn(
            "px-2 py-1 rounded border text-xs mb-1 cursor-pointer hover:opacity-80 transition-opacity",
            statusConfig[shift.status]
        )}>
            <p className="font-medium truncate">{staffName}</p>
            <p className="opacity-75">
                {format(new Date(shift.start_time), "HH:mm")}–{format(new Date(shift.end_time), "HH:mm")}
            </p>
        </div>
    );
}

// ── Create Shift Dialog ────────────────────────────────────────────────────

function CreateShiftDialog({
    open,
    onClose,
    selectedDate,
    staffList,
}: {
    open: boolean;
    onClose: () => void;
    selectedDate: Date;
    staffList: Staff[];
}) {
    const queryClient = useQueryClient();
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const [form, setForm] = useState<CreateShiftForm>({
        staff_id: "",
        start_time: `${dateStr}T17:00`,
        end_time: `${dateStr}T23:00`,
        role: "bar_staff",
        notes: "",
    });

    const update = (field: keyof CreateShiftForm, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const { mutate: createShift, isPending } = useMutation({
        mutationFn: async (data: CreateShiftForm) => {
            const { data: res } = await api.post("/shifts/", {
                ...data,
                start_time: new Date(data.start_time).toISOString(),
                end_time: new Date(data.end_time).toISOString(),
            });
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shifts"] });
            toast.success("Shift created");
            onClose();
        },
        onError: () => toast.error("Failed to create shift"),
    });

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#16213E] border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white">
                        Add Shift — {format(selectedDate, "EEEE dd MMM")}
                    </DialogTitle>
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

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs">Start Time</Label>
                            <Input
                                type="datetime-local"
                                value={form.start_time}
                                onChange={(e) => update("start_time", e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs">End Time</Label>
                            <Input
                                type="datetime-local"
                                value={form.end_time}
                                onChange={(e) => update("end_time", e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-gray-300 text-xs">Role</Label>
                        <Select value={form.role} onValueChange={(v) => update("role", v)}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#16213E] border-white/10">
                                {["bar_staff", "bartender", "manager", "chef", "kitchen_staff", "floor_staff", "security"].map((r) => (
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
                            placeholder="e.g. Cover for bank holiday"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={onClose} className="border-white/10 text-gray-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => createShift(form)}
                        disabled={isPending || !form.staff_id}
                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                    >
                        {isPending ? "Creating..." : "Create Shift"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function SchedulePage() {
    const queryClient = useQueryClient();
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [showCreate, setShowCreate] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const weekStartStr = format(weekStart, "yyyy-MM-dd");
    const weekEndStr = format(addDays(weekStart, 6), "yyyy-MM-dd");

    const { data: shifts = [], isLoading: shiftsLoading } = useQuery<Shift[]>({
        queryKey: ["shifts", weekStartStr],
        queryFn: async () => {
            const { data } = await api.get(
                `/shifts/?week_start=${weekStartStr}&week_end=${weekEndStr}`
            );
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

    const { mutate: publishRoster, isPending: publishing } = useMutation({
        mutationFn: async () => {
            await api.post(`/shifts/publish?week_start=${weekStartStr}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shifts"] });
            toast.success("Roster published — staff notified by email");
        },
        onError: () => toast.error("Failed to publish roster"),
    });

    const getStaffName = (staffId: string) => {
        const s = staffList.find((s) => s.id === staffId);
        return s ? `${s.first_name} ${s.last_name}` : "Unknown";
    };

    const getShiftsForDay = (day: Date) =>
        shifts.filter((s) => isSameDay(new Date(s.start_time), day));

    const draftCount = shifts.filter((s) => s.status === "draft").length;
    const publishedCount = shifts.filter((s) => s.status === "published").length;
    const totalHours = shifts
        .filter((s) => s.status !== "cancelled")
        .reduce((acc, s) => {
            const hours =
                (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 3600000;
            return acc + hours;
        }, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Schedule</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {draftCount} draft · {publishedCount} published · {totalHours.toFixed(0)}h scheduled
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => publishRoster()}
                        disabled={publishing || draftCount === 0}
                        className="border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        {publishing ? "Publishing..." : `Publish ${draftCount} Drafts`}
                    </Button>
                    <Button
                        onClick={() => { setSelectedDate(new Date()); setShowCreate(true); }}
                        className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Shift
                    </Button>
                </div>
            </div>

            {/* Week Navigator */}
            <div className="bg-[#16213E] border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-white">
                            {format(weekStart, "dd MMM")} — {format(addDays(weekStart, 6), "dd MMM yyyy")}
                        </p>
                    </div>
                    <button
                        onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                        const dayShifts = getShiftsForDay(day);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "min-h-32 p-2 rounded-lg border cursor-pointer transition-colors",
                                    isToday
                                        ? "border-[#C9A84C]/40 bg-[#C9A84C]/5"
                                        : "border-white/5 hover:border-white/20 bg-white/3"
                                )}
                                onClick={() => { setSelectedDate(day); setShowCreate(true); }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="text-xs text-gray-500">{format(day, "EEE")}</p>
                                        <p className={cn(
                                            "text-sm font-semibold",
                                            isToday ? "text-[#C9A84C]" : "text-white"
                                        )}>
                                            {format(day, "d")}
                                        </p>
                                    </div>
                                    {dayShifts.length > 0 && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-gray-400">
                                            {dayShifts.length}
                                        </span>
                                    )}
                                </div>

                                {shiftsLoading ? (
                                    <div className="h-8 rounded bg-white/5 animate-pulse" />
                                ) : (
                                    <div>
                                        {dayShifts.slice(0, 3).map((shift) => (
                                            <ShiftPill
                                                key={shift.id}
                                                shift={shift}
                                                staffName={getStaffName(shift.staff_id)}
                                            />
                                        ))}
                                        {dayShifts.length > 3 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                +{dayShifts.length - 3} more
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Shift List */}
            <div className="bg-[#16213E] border border-white/10 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10">
                    <h2 className="text-sm font-semibold text-white">
                        All Shifts — Week of {format(weekStart, "dd MMM yyyy")}
                    </h2>
                </div>

                {shifts.length === 0 ? (
                    <div className="p-12 text-center">
                        <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No shifts this week</p>
                        <p className="text-gray-600 text-sm mt-1">Click a day to add shifts</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {shifts
                            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                            .map((shift) => {
                                const hours =
                                    (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3600000;
                                return (
                                    <div key={shift.id} className="px-6 py-3 flex items-center gap-4 hover:bg-white/3 transition-colors">
                                        <div className="w-20 flex-shrink-0">
                                            <p className="text-xs text-gray-500">{format(new Date(shift.start_time), "EEE dd MMM")}</p>
                                        </div>
                                        <div className="flex-1 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                                                <span className="text-[#C9A84C] text-xs font-bold">
                                                    {getStaffName(shift.staff_id).split(" ").map((n) => n[0]).join("")}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{getStaffName(shift.staff_id)}</p>
                                                <p className="text-xs text-gray-500 capitalize">{shift.role.replace(/_/g, " ")}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                                            {format(new Date(shift.start_time), "HH:mm")}–{format(new Date(shift.end_time), "HH:mm")}
                                            <span className="text-gray-500">({hours.toFixed(1)}h)</span>
                                        </div>
                                        <div>
                                            {shift.status === "published" ? (
                                                <span className="flex items-center gap-1 text-xs text-[#C9A84C]">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Published
                                                </span>
                                            ) : shift.status === "cancelled" ? (
                                                <span className="flex items-center gap-1 text-xs text-red-400">
                                                    <XCircle className="w-3.5 h-3.5" /> Cancelled
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-500">Draft</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            <CreateShiftDialog
                open={showCreate}
                onClose={() => setShowCreate(false)}
                selectedDate={selectedDate}
                staffList={staffList}
            />
        </div>
    );
}