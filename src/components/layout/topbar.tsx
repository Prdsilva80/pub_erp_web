"use client";

import { Bell, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Topbar() {
    const { user } = useAuthStore();
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    return (
        <header className="h-16 border-b border-white/10 bg-[#1A1A2E]/80 backdrop-blur-sm flex items-center justify-between px-6">
            <div>
                <p className="text-sm text-gray-400">{greeting},</p>
                <p className="text-base font-semibold text-white">
                    {user?.first_name} {user?.last_name}
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Search..."
                        className="pl-9 w-64 bg-white/5 border-white/10 text-sm text-white placeholder:text-gray-500 focus:border-[#C9A84C]"
                    />
                </div>

                <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center bg-[#C9A84C] text-[#1A1A2E] text-[10px]">
                        3
                    </Badge>
                </button>
            </div>
        </header>
    );
}