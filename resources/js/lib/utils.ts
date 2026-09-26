import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and resolves Tailwind CSS conflicts with twMerge.
 * Standard utility function for 21st.dev and shadcn/ui components.
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
