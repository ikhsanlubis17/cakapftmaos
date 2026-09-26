import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import { queryClient } from "./queryClient";
import { RouterSetup } from "./router";

// Import CSS
import "../css/app.css";

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <SiteSettingsProvider>
                {/* AuthProvider depends on QueryClientProvider */}
                <AuthProvider>
                    <ToastProvider>
                        <RouterSetup />
                    </ToastProvider>
                </AuthProvider>
            </SiteSettingsProvider>

            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("app");
    if (container) {
        const root = createRoot(container);
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    }
});
