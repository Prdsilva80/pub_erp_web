"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import {
    LayoutDashboard, Users, Calendar, Clock, ShoppingCart,
    Coins, Package, GraduationCap, Brain, CreditCard,
    Settings, LogOut, Beer,
} from "lucide-react";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Command Centre", icon: LayoutDashboard },
    { href: "/staff", label: "Staff", icon: Users },
    { href: "/schedule", label: "Schedule", icon: Calendar },
    { href: "/timesheets", label: "Timesheets", icon: Clock },
    { href: "/sales", label: "Sales", icon: ShoppingCart },
    { href: "/tips", label: "Tips", icon: Coins },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/training", label: "Training", icon: GraduationCap },
    { href: "/ai", label: "AI Insights", icon: Brain },
    { href: "/billing", label: "Billing", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-[#16213E] border-r border-white/10 flex flex-col z-50">
            <div className="px-6 py-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#C9A84C] rounded-lg flex items-center justify-center">
                        <Beer className="w-5 h-5 text-[#1A1A2E]" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-[#C9A84C]">PubERP</h1>
                        <p className="text-xs text-gray-500">Command Centre</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                active
                                    ? "bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/20"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <div className="px-3 py-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                        <span className="text-[#C9A84C] text-xs font-bold">
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign out
                </button>
            </div>
        </aside>
    );
}