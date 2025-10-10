// API Response Types

export interface AparType {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Apar {
    id: number;
    serial_number: string;
    location_name: string;
    location_type: 'statis' | 'mobile' | string;
    valid_radius?: number;
    apar_type_id?: number;
    capacity?: number;
    manufactured_date?: string;
    expired_at?: string;
    status?: string;
    notes?: string;
    aparType?: { name?: string } | null;
    tank_truck?: { plate_number?: string; driver_name?: string } | null;
    latitude?: number | string;
    longitude?: number | string;
    qr_code?: string | null;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message: string;
}

export interface AparTypeListResponse extends ApiResponse<AparType[]> {}

// Specific response type for AparType index endpoint
export type AparTypeIndexResponse = ApiResponse<AparType[]>;