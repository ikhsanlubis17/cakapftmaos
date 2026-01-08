// Inspection Types
export interface Apar {
    id: number;
    serial_number: string;
    location_name: string;
    location_type: 'statis' | 'mobile';
    latitude?: number;
    longitude?: number;
    valid_radius?: number;
    qr_code: string;
    status: string;
    apar_type?: AparType;
    tank_truck?: TankTruck;
}

export interface AparType {
    id: number;
    name: string;
    description?: string;
}

export interface TankTruck {
    id: number;
    license_plate: string;
    driver_name?: string;
}

export interface DamageCategory {
    id: number;
    name: string;
    description?: string;
}

export interface InspectionDamage {
    id: number;
    inspection_id: number;
    damage_category_id: number;
    notes?: string;
    damage_photo_url: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    damageCategory?: DamageCategory;
}

export interface InspectionSchedule {
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
    apar?: Apar;
    assignedUser?: User;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'supervisor' | 'teknisi';
}

export interface RepairApproval {
    id: number;
    inspection_id: number;
    status: 'pending' | 'approved' | 'rejected';
    approver_id?: number;
    approved_at?: string;
    notes?: string;
    approver?: User;
    repairReport?: RepairReport;
}

export interface RepairReport {
    id: number;
    repair_approval_id: number;
    description: string;
    completed_at?: string;
}

export interface Inspection {
    id: number | string;
    apar_id: number;
    user_id: number;
    photo_url: string;
    selfie_url: string;
    condition: 'good' | 'needs_refill' | 'expired' | 'damaged';
    notes?: string;
    inspection_lat?: number;
    inspection_lng?: number;
    location_valid: boolean;
    is_valid: boolean;
    status: 'pending' | 'completed' | 'failed';
    schedule_id?: number;
    repair_status: 'none' | 'pending_approval' | 'approved' | 'rejected' | 'completed';
    requires_repair: boolean;
    created_at: string;
    updated_at: string;
    apar?: Apar;
    user?: User;
    schedule?: InspectionSchedule;
    inspectionDamages?: InspectionDamage[];
    repairApproval?: RepairApproval;
    // For pending schedules
    is_schedule?: boolean;
    scheduled_date?: string;
    start_at?: string;
    end_at?: string;
    scheduled_time?: string;
}

export interface InspectionFormData {
    apar_id: number;
    apar_qrCode?: string;
    condition: 'good' | 'needs_refill' | 'expired' | 'damaged';
    notes?: string;
    photo: File | null;
    selfie: File | null;
    lat?: number;
    lng?: number;
    damage_categories?: DamageCategoryInput[];
    schedule_id?: number;
}

export interface DamageCategoryInput {
    category_id: number;
    notes?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    damage_photo: File;
}

export interface LocationValidation {
    valid: boolean;
    message: string;
    distance?: number;
    valid_radius?: number;
    apar_location?: {
        lat: number;
        lng: number;
    };
    user_location?: {
        lat: number;
        lng: number;
    };
}

export interface TimeValidation {
    valid: boolean;
    message: string;
    schedule?: {
        id: number;
        scheduled_date: string;
        scheduled_time: string;
        start_at: string;
        end_at: string;
    };
    scheduled_time?: string;
    valid_window?: string;
}
