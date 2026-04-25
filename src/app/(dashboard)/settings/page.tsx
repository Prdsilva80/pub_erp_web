"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import {
    User, Bell, Shield, Building2,
    Save, Eye, EyeOff, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface ChangePasswordForm {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

// ── Section ────────────────────────────────────────────────────────────────

function Section({
    icon: Icon,
    title,
    description,
    children,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-[#16213E] border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#C9A84C]" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-white">{title}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications" | "venue">("profile");
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    const [notifications, setNotifications] = useState({
        email_shift_reminders: true,
        email_roster_published: true,
        email_compliance_alerts: true,
        email_weekly_briefing: true,
        email_payroll: true,
        email_low_stock: true,
    });

    const updatePw = (field: keyof ChangePasswordForm, value: string) =>
        setPasswordForm((prev) => ({ ...prev, [field]: value }));

    const { mutate: changePassword, isPending: changingPw } = useMutation({
        mutationFn: async (data: ChangePasswordForm) => {
            if (data.new_password !== data.confirm_password) {
                throw new Error("Passwords do not match");
            }
            if (data.new_password.length < 8) {
                throw new Error("Password must be at least 8 characters");
            }
            await api.post("/auth/change-password", {
                current_password: data.current_password,
                new_password: data.new_password,
            });
        },
        onSuccess: () => {
            toast.success("Password changed successfully");
            setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
        },
        onError: (err: Error) => toast.error(err.message || "Failed to change password"),
    });

    const { mutate: saveNotifications, isPending: savingNotifications } = useMutation({
        mutationFn: async (data: typeof notifications) => {
            await api.patch("/auth/notifications", data);
        },
        onSuccess: () => toast.success("Notification preferences saved"),
        onError: () => toast.error("Failed to save preferences"),
    });

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "security", label: "Security", icon: Shield },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "venue", label: "Venue", icon: Building2 },
    ] as const;

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-sm text-gray-400 mt-1">Manage your account and preferences</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1 w-fit">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all",
                            activeTab === id
                                ? "bg-[#C9A84C] text-[#1A1A2E]"
                                : "text-gray-400 hover:text-white"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
                <Section
                    icon={User}
                    title="Profile Information"
                    description="Your account details"
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                                <span className="text-[#C9A84C] text-xl font-bold">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </span>
                            </div>
                            <div>
                                <p className="text-base font-semibold text-white">
                                    {user?.first_name} {user?.last_name}
                                </p>
                                <p className="text-sm text-gray-400">{user?.email}</p>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20 capitalize mt-1 inline-block">
                                    {user?.role}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-gray-300 text-xs">First Name</Label>
                                <Input
                                    defaultValue={user?.first_name}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-gray-300 text-xs">Last Name</Label>
                                <Input
                                    defaultValue={user?.last_name}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-gray-300 text-xs">Email Address</Label>
                                <Input
                                    defaultValue={user?.email}
                                    type="email"
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold">
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </Section>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
                <div className="space-y-4">
                    <Section
                        icon={Shield}
                        title="Change Password"
                        description="Update your account password"
                    >
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-gray-300 text-xs">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showCurrentPw ? "text" : "password"}
                                        value={passwordForm.current_password}
                                        onChange={(e) => updatePw("current_password", e.target.value)}
                                        className="bg-white/5 border-white/10 text-white pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-gray-300 text-xs">New Password</Label>
                                <div className="relative">
                                    <Input
                                        type={showNewPw ? "text" : "password"}
                                        value={passwordForm.new_password}
                                        onChange={(e) => updatePw("new_password", e.target.value)}
                                        className="bg-white/5 border-white/10 text-white pr-10"
                                        placeholder="Minimum 8 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPw(!showNewPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-gray-300 text-xs">Confirm New Password</Label>
                                <Input
                                    type="password"
                                    value={passwordForm.confirm_password}
                                    onChange={(e) => updatePw("confirm_password", e.target.value)}
                                    className={cn(
                                        "bg-white/5 border-white/10 text-white",
                                        passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password
                                            ? "border-red-400/50"
                                            : passwordForm.confirm_password && passwordForm.new_password === passwordForm.confirm_password
                                                ? "border-emerald-400/50"
                                                : ""
                                    )}
                                />
                                {passwordForm.confirm_password && passwordForm.new_password === passwordForm.confirm_password && (
                                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Passwords match
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={() => changePassword(passwordForm)}
                                    disabled={changingPw || !passwordForm.current_password || !passwordForm.new_password}
                                    className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                                >
                                    <Shield className="w-4 h-4 mr-2" />
                                    {changingPw ? "Changing..." : "Change Password"}
                                </Button>
                            </div>
                        </div>
                    </Section>

                    <Section
                        icon={Shield}
                        title="Session Information"
                        description="Active sessions and security"
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                <div>
                                    <p className="text-sm text-white font-medium">Current Session</p>
                                    <p className="text-xs text-gray-500">Browser · Ireland</p>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                                    Active
                                </span>
                            </div>
                        </div>
                    </Section>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
                <Section
                    icon={Bell}
                    title="Email Notifications"
                    description="Choose which emails you receive from PubERP"
                >
                    <div className="space-y-3">
                        {[
                            { key: "email_shift_reminders", label: "Shift Reminders", desc: "24h before each scheduled shift" },
                            { key: "email_roster_published", label: "Roster Published", desc: "When weekly roster is published" },
                            { key: "email_compliance_alerts", label: "Compliance Alerts", desc: "Document expiry and WTA violations" },
                            { key: "email_weekly_briefing", label: "AI Weekly Briefing", desc: "Monday morning AI-generated briefing" },
                            { key: "email_payroll", label: "Payroll Reports", desc: "Weekly payroll export and P&L summary" },
                            { key: "email_low_stock", label: "Low Stock Alerts", desc: "When inventory falls below reorder threshold" },
                        ].map(({ key, label, desc }) => (
                            <div
                                key={key}
                                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                            >
                                <div>
                                    <p className="text-sm text-white font-medium">{label}</p>
                                    <p className="text-xs text-gray-500">{desc}</p>
                                </div>
                                <button
                                    onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key as keyof typeof notifications] }))}
                                    className={cn(
                                        "w-10 h-5 rounded-full transition-all duration-200 relative",
                                        notifications[key as keyof typeof notifications] ? "bg-[#C9A84C]" : "bg-white/20"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all duration-200",
                                        notifications[key as keyof typeof notifications] ? "left-5" : "left-0.5"
                                    )} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={() => saveNotifications(notifications)}
                            disabled={savingNotifications}
                            className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {savingNotifications ? "Saving..." : "Save Preferences"}
                        </Button>
                    </div>
                </Section>
            )}

            {/* Venue Tab */}
            {activeTab === "venue" && (
                <Section
                    icon={Building2}
                    title="Venue Settings"
                    description="Configure your venue details and operational settings"
                >
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs">Venue Name</Label>
                            <Input className="bg-white/5 border-white/10 text-white" placeholder="The Silver Tap" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-gray-300 text-xs">County</Label>
                                <Input className="bg-white/5 border-white/10 text-white" placeholder="Dublin" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-gray-300 text-xs">Eircode</Label>
                                <Input className="bg-white/5 border-white/10 text-white" placeholder="D01 X2X2" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-gray-300 text-xs">Opening Time</Label>
                                <Input type="time" defaultValue="10:30" className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-gray-300 text-xs">Closing Time</Label>
                                <Input type="time" defaultValue="23:30" className="bg-white/5 border-white/10 text-white" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-gray-300 text-xs">Labour Cost Target (%)</Label>
                            <Input
                                type="number"
                                defaultValue="30"
                                min="0"
                                max="100"
                                className="bg-white/5 border-white/10 text-white"
                            />
                            <p className="text-xs text-gray-500">PubERP will alert you when labour exceeds this % of revenue</p>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button className="bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold">
                                <Save className="w-4 h-4 mr-2" />
                                Save Settings
                            </Button>
                        </div>
                    </div>
                </Section>
            )}
        </div>
    );
}