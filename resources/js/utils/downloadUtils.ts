/**
 * Utility for triggering browser file downloads from Blob or raw data.
 */
export const downloadBlob = (blob: Blob | any, filename: string): void => {
    const blobObj = blob instanceof Blob ? blob : new Blob([blob]);
    const url = window.URL.createObjectURL(blobObj);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
