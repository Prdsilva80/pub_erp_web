"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    CreditCard, CheckCircle, Zap, Building2,
    ArrowRight, ExternalLink, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface SubscriptionStatus {
    tier: "free" | "professional" | "enterprise";
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    is_active: boolean;
}

// ── Plan Card ──────────────────────────────────────────────────────────────

function PlanCard({
    name,
    price,
    description,
    features,
    tier,
    currentTier,
    onUpgrade,
    isLoading,
    highlighted,
}: {
    name: string;
    price: string;
    description: string;
    features: string[];
    tier: "professional" | "enterprise";
    currentTier: string;
    onUpgrade: (tier: "professional" | "enterprise") => void;
    isLoading: boolean;
    highlighted?: boolean;
}) {
    const isCurrent = currentTier === tier;

    return (
        <div className={cn(
            "bg-[#16213E] border rounded-xl p-6 relative transition-all",
            highlighted ? "border-[#C9A84C]/50 shadow-lg shadow-[#C9A84C]/10" : "border-white/10",
            isCurrent && "border-emerald-400/40"
        )}>
            {highlighted && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#C9A84C] text-[#1A1A2E] text-xs font-bold px-3 py-1 rounded-full">
                        Most Popular
                    </span>
                </div>
            )}
            {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Current Plan
                    </span>
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-lg font-bold text-white">{name}</h3>
                <p className="text-gray-400 text-sm mt-1">{description}</p>
                <div className="mt-4">
                    <span className="text-4xl font-bold text-white">{price}</span>
                    <span className="text-gray-400 text-sm">/month</span>
                </div>
            </div>

            <ul className="space-y-3 mb-6">
                {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                onClick={() => onUpgrade(tier)}
                disabled={isLoading || isCurrent}
                className={cn(
                    "w-full font-semibold",
                    isCurrent
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                        : highlighted
                            ? "bg-[#C9A84C] hover:bg-[#B8963C] text-[#1A1A2E]"
                            : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                )}
            >
                {isCurrent ? "Current Plan" : isLoading ? "Redirecting..." : (
                    <span className="flex items-center gap-2">
                        Upgrade to {name} <ArrowRight className="w-4 h-4" />
                    </span>
                )}
            </Button>
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function BillingPage() {
    const { data: status, isLoading: statusLoading } = useQuery<SubscriptionStatus>({
        queryKey: ["subscription-status"],
        queryFn: async () => {
            const { data } = await api.get("/billing/status");
            return data;
        },
    });

    const { mutate: createCheckout, isPending: checkoutLoading } = useMutation({
        mutationFn: async (tier: "professional" | "enterprise") => {
            const { data } = await api.post("/billing/checkout", {
                tier,
                success_url: `${window.location.origin}/billing?success=true`,
                cancel_url: `${window.location.origin}/billing?cancelled=true`,
            });
            return data;
        },
        onSuccess: (data) => {
            window.location.href = data.checkout_url;
        },
        onError: () => toast.error("Failed to create checkout session"),
    });

    const { mutate: openPortal, isPending: portalLoading } = useMutation({
        mutationFn: async () => {
            const { data } = await api.post("/billing/portal", null, {
                params: { return_url: `${window.location.origin}/billing` },
            });
            return data;
        },
        onSuccess: (data) => {
            window.location.href = data.portal_url;
        },
        onError: () => toast.error("Failed to open billing portal"),
    });

    const tierConfig = {
        free: { label: "Free", color: "text-gray-400 bg-gray-400/10 border-gray-400/20" },
        professional: { label: "Professional", color: "text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/20" },
        enterprise: { label: "Enterprise", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
    };

    const currentTierConfig = tierConfig[status?.tier || "free"];

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Billing</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Manage your PubERP subscription
                </p>
            </div>

            {/* Current Plan */}
            <div className="bg-[#16213E] border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-[#C9A84C]" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Current Plan</p>
                            {statusLoading ? (
                                <div className="h-6 w-32 bg-white/10 rounded animate-pulse mt-1" />
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn(
                                        "text-sm font-semibold px-3 py-1 rounded-full border",
                                        currentTierConfig.color
                                    )}>
                                        {currentTierConfig.label}
                                    </span>
                                    {status?.is_active ? (
                                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                                            <CheckCircle className="w-3 h-3" /> Active
                                        </span>
                                    ) : (
                                        <span className="text-xs text-red-400">Inactive</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {status?.stripe_customer_id && (
                        <Button
                            variant="outline"
                            onClick={() => openPortal()}
                            disabled={portalLoading}
                            className="border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {portalLoading ? "Opening..." : "Manage Subscription"}
                        </Button>
                    )}
                </div>

                {status?.stripe_subscription_id && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-gray-500">
                            Subscription ID: <span className="font-mono text-gray-400">{status.stripe_subscription_id}</span>
                        </p>
                    </div>
                )}
            </div>

            {/* Plans */}
            {status?.tier === "free" || !status?.is_active ? (
                <div>
                    <h2 className="text-base font-semibold text-white mb-4">Choose a Plan</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PlanCard
                            name="Professional"
                            price="€149"
                            description="For established pubs managing up to 30 staff"
                            tier="professional"
                            currentTier={status?.tier || "free"}
                            onUpgrade={createCheckout}
                            isLoading={checkoutLoading}
                            highlighted
                            features={[
                                "Up to 30 staff members",
                                "Full scheduling & timesheets",
                                "Sales & tips management",
                                "Inventory tracking",
                                "AI weekly briefings",
                                "Irish compliance tools",
                                "Payroll CSV export (Thesaurus)",
                                "Email notifications",
                                "Priority support",
                            ]}
                        />
                        <PlanCard
                            name="Enterprise"
                            price="€299"
                            description="For pub groups and multi-venue operations"
                            tier="enterprise"
                            currentTier={status?.tier || "free"}
                            onUpgrade={createCheckout}
                            isLoading={checkoutLoading}
                            features={[
                                "Unlimited staff members",
                                "Multi-venue management",
                                "Everything in Professional",
                                "Advanced AI forecasting",
                                "Custom integrations (POS)",
                                "Dedicated account manager",
                                "SLA guarantee",
                                "Custom compliance reports",
                                "API access",
                            ]}
                        />
                    </div>
                </div>
            ) : (
                <div className="bg-[#16213E] border border-emerald-400/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-base font-semibold text-white">Your subscription is active</h2>
                    </div>
                    <p className="text-sm text-gray-400">
                        You have full access to all {currentTierConfig.label} features.
                        Use the Manage Subscription button above to update payment details,
                        view invoices, or cancel your subscription.
                    </p>
                </div>
            )}

            {/* Features Comparison */}
            <div className="bg-[#16213E] border border-white/10 rounded-xl p-6">
                <h2 className="text-base font-semibold text-white mb-4">Why PubERP?</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {[
                        {
                            icon: Shield,
                            title: "Irish Compliance",
                            desc: "Built for the Working Time Act, Tips Act 2022, and Sick Leave Act. Stay compliant automatically.",
                        },
                        {
                            icon: Zap,
                            title: "AI-Powered",
                            desc: "Prophet forecasting, anomaly detection, and GPT-4o briefings keep you ahead of your numbers.",
                        },
                        {
                            icon: Building2,
                            title: "Built for Pubs",
                            desc: "Not generic HR software. Every feature is designed for Irish hospitality operations.",
                        },
                    ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-[#C9A84C]" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{title}</p>
                                <p className="text-xs text-gray-400 mt-1">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}