// API Response Types

export interface AparType {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message: string;
}

export interface AparTypeListResponse extends ApiResponse<AparType[]> {}

// Specific response type for AparType index endpoint
export type AparTypeIndexResponse = ApiResponse<AparType[]>;