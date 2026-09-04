import React from "react";

// Error Boundary Component
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Navigation error caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <div className="text-center bg-white border border-slate-200 rounded-[6px] p-8 shadow-sm max-w-md w-full">
                        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-[6px] bg-[#041562] text-white mb-4">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mb-1">
                            Terjadi Kesalahan
                        </h2>
                        <p className="text-slate-500 text-xs mb-6">
                            Maaf, terjadi kesalahan teknis saat memuat halaman ini.
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.href = '/dashboard';
                            }}
                            className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] shadow-sm transition-colors"
                        >
                            Kembali ke Dashboard
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}