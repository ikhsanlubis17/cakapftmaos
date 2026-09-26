/**
 * Normalizes storage URLs to relative paths or current host,
 * preventing broken image links caused by localhost vs domain mismatch (.test vs 127.0.0.1:8080).
 */
export function formatStorageUrl(url?: string | null): string {
    if (!url) return '';

    // If it's already a blob or data URL, return as-is
    if (url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }

    // If it contains /storage/, extract the relative path from /storage/ onwards
    const storageIndex = url.indexOf('/storage/');
    if (storageIndex !== -1) {
        return url.substring(storageIndex);
    }

    return url;
}

export default formatStorageUrl;
