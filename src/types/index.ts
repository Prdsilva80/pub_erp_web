export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: "owner" | "manager" | "staff";
    venue_id: string;
}

export interface Venue {
    id: string;
    name: string;
    subscription_tier: "free" | "professional" | "enterprise";
    is_active: boolean;
    stripe_customer_id?: string;
}

export interface Staff {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    contract_type: string;
    hourly_rate: number;
    status: "active" | "inactive" | "suspended";
    start_date: string;
    rsa_certified: boolean;
    rsa_expiry?: string;
    work_permit_expiry?: string;
}

export interface Shift {
    id: string;
    staff_id: string;
    venue_id: string;
    start_time: string;
    end_time: string;
    role: string;
    status: "draft" | "published" | "cancelled";
    notes?: string;
}

export interface Timesheet {
    id: string;
    staff_id: string;
    clocked_in: string;
    clocked_out?: string;
    total_hours_worked?: number;
    total_pay?: number;
    status: "pending" | "approved" | "disputed";
}

export interface Transaction {
    id: string;
    amount: number;
    transaction_type: string;
    payment_method: string;
    transaction_time: string;
    staff_id?: string;
    notes?: string;
}

export interface TipRecord {
    id: string;
    total_amount: number;
    collection_date: string;
    is_distributed: boolean;
    distributed_at?: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    current_quantity: number;
    unit: string;
    reorder_threshold: number;
    supplier_name?: string;
    cost_per_unit?: number;
}

export interface AIInsight {
    id: string;
    insight_type: string;
    severity: "info" | "warning" | "critical";
    title: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface WeeklyPnL {
    revenue: number;
    labour_cost: number;
    labour_cost_pct: number;
    gross_margin_estimate: number;
    transaction_count: number;
    avg_transaction: number;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}