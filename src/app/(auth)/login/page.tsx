"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((s) => s.login);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            router.push("/dashboard");
        } catch {
            toast.error("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1A1A2E]">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-bold text-[#C9A84C] tracking-tight">
                        PubERP
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Enterprise Management for Irish Hospitality
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[#16213E] border border-white/10 rounded-xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-6">
                        Sign in to your account
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm text-gray-300">
                                Email address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="owner@thesilvretap.ie"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#C9A84C] focus:ring-[#C9A84C]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm text-gray-300">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#C9A84C] focus:ring-[#C9A84C]"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E] font-semibold h-11"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Sign in"
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-xs text-gray-500 mt-6">
                        PubERP v1.0 · Secure · GDPR Compliant
                    </p>
                </div>
            </div>
        </div>
    );
}