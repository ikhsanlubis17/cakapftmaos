import { Apar, User } from './inspection.types';

// Schedule Types
export interface Schedule {
    id: number;
    apar_id: number;
    assigned_user_id: number;
    start_at: string;
    end_at: string;
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'semiannual';
    is_active: boolean;
    is_completed: boolean;
    notes?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    start_time?: string;
    end_time?: string;
    created_at: string;
    updated_at: string;
    apar?: Apar;
    assignedUser?: User;
}

export interface ScheduleFormData {
    apar_id: number;
    assigned_user_id: number;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'semiannual';
    is_active: boolean;
    notes?: string;
}

export interface ScheduleFilters {
    search: string;
    status: 'all' | 'today' | 'upcoming' | 'overdue';
    active: 'all' | 'active' | 'inactive';
}

export interface SchedulePagination {
    current_page: number;
    data: Schedule[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface ScheduleStats {
    total: number;
    active: number;
    completed: number;
    overdue: number;
    today: number;
    upcoming: number;
}
