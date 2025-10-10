import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import CSS
import '../css/app.css';

// Import Layout
import LayoutEnhanced from './components/LayoutEnhanced';

// Import existing pages
import Login from './pages/Login';
import Welcome from './pages/Welcome';

// Import enhanced pages
import DashboardEnhanced from './pages/DashboardEnhanced';
import AparList from './pages/AparList';
import AparDetail from './pages/AparDetail';
import AparCreate from './pages/AparCreate';
import AparEdit from './pages/AparEdit';
import TankTruckList from './pages/TankTruckList';
import TankTruckDetail from './pages/TankTruckDetail';
import TankTruckEdit from './pages/TankTruckEdit';
import UserList from './pages/UserList';
import UserCreate from './pages/UserCreate';
import UserEdit from './pages/UserEdit';
import UserDetail from './pages/UserDetail';
import UsersManagement from './pages/UsersManagement';
import InspectionFormEnhanced from './pages/InspectionFormEnhanced';
import InspectionForm from './pages/InspectionForm';
import QRScanner from './components/QRScanner';

// Import role-based components
import MyInspections from './pages/MyInspections';
import MySchedules from './pages/MySchedules';
import InspectionsList from './pages/InspectionsList';
import SchedulesManagement from './pages/SchedulesManagement';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import ReportsAndAudit from './pages/ReportsAndAudit';
import AparTypeManagement from './pages/AparTypeManagement';

// Import NEW enhanced features
import DamageCategoryManagement from './pages/DamageCategoryManagement';
import RepairApprovalList from './pages/RepairApprovalList';
import RepairApprovalDetail from './pages/RepairApprovalDetail';
import RepairReportForm from './pages/RepairReportForm';
import MyRepairApprovals from './pages/MyRepairApprovals';

// Error Boundary Component
class ErrorBoundary extends React.Component {
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
                <div className="min-h-screen flex items-center justify-center bg-white">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-4">
                            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Terjadi Kesalahan
                        </h2>
                        <p className="text-gray-500 mb-4">
                            Maaf, terjadi kesalahan saat memuat halaman ini.
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.href = '/dashboard';
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
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

// Role-based route protection component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, isPending } = useAuth();
    const location = useLocation();

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-white shadow-lg mb-4">
                        <img
                            src="/images/logo2.svg"
                            alt="CAKAP FT MAOS Logo"
                            className="h-10 w-10"
                        />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        CAKAP FT MAOS
                    </h2>
                    <p className="text-gray-500">Memuat aplikasi...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-4">
                        <img
                            src="/images/logo2.svg"
                            alt="CAKAP FT MAOS Logo"
                            className="h-8 w-8"
                        />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Akses Ditolak
                    </h2>
                    <p className="text-gray-500 mb-4">
                        Anda tidak memiliki izin untuk mengakses halaman ini.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

function AppRoutes() {
    const { user, isPending } = useAuth();

    // Debug route definitions
    useEffect(() => {
        if (user) {
            console.log('=== ROUTE DEFINITIONS DEBUG ===');
            console.log('User role:', user.role);
            console.log('Available routes for this user:');

            // Log all available routes based on user role
            const availableRoutes = [];

            if (user.role === 'admin') {
                availableRoutes.push(
                    '/dashboard',
                    '/dashboard/apar',
                    '/dashboard/apar-types',
                    '/dashboard/damage-categories',
                    '/dashboard/tank-trucks',
                    '/dashboard/users',
                    '/dashboard/schedules',
                    '/dashboard/repair-approvals',
                    '/dashboard/reports',
                    '/dashboard/settings',
                    '/dashboard/audit-logs'
                );
            } else if (user.role === 'supervisor') {
                availableRoutes.push(
                    '/dashboard',
                    '/dashboard/apar',
                    '/dashboard/inspections',
                    '/dashboard/tank-trucks',
                    '/dashboard/repair-approvals',
                    '/dashboard/reports'
                );
            } else if (user.role === 'teknisi') {
                availableRoutes.push(
                    '/dashboard',
                    '/dashboard/my-schedules',
                    '/dashboard/scan',
                    '/dashboard/my-inspections',
                    '/dashboard/my-repairs'
                );
            }

            console.log('Available routes:', availableRoutes);
        }
    }, [user]);

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-white shadow-lg mb-4">
                        <img
                            src="/images/logo2.svg"
                            alt="CAKAP FT MAOS Logo"
                            className="h-10 w-10"
                        />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        CAKAP FT MAOS
                    </h2>
                    <p className="text-gray-500">Memuat aplikasi...</p>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Auth Routing */}
            <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" replace /> : <Login />}
            />

            {/* Welcome Page - Public */}
            <Route path="/" element={<Welcome />} />

            {/* App Routing with Enhanced Layout - ALL ROUTES INSIDE THIS */}
            <Route path="/dashboard" element={user ? <LayoutEnhanced /> : <Navigate to="/login" replace />}>
                {/* Dashboard - All roles */}
                <Route index element={<DashboardEnhanced />} />

                {/* APAR Routes - Supervisor & Admin only */}
                <Route
                    path="apar"
                    element={
                        <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                            <AparList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="apar/create"
                    element={
                        <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                            <AparCreate />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="apar/:id/edit"
                    element={
                        <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                            <AparEdit />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="apar/:id"
                    element={
                        <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                            <AparDetail />
                        </ProtectedRoute>
                    }
                />

                {/* APAR Types - Admin only */}
                <Route
                    path="apar-types"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AparTypeManagement />
                        </ProtectedRoute>
                    }
                />

                {/* Tank Trucks - Supervisor & Admin only */}
                <Route
                    path="tank-trucks"
                    element={
                        <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                            <TankTruckList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="tank-trucks/:id/edit"
                    element={
                        <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                            <TankTruckEdit />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="tank-trucks/:id"
                    element={
                        <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                            <TankTruckDetail />
                        </ProtectedRoute>
                    }
                />

                {/* Users Management - Admin only */}
                <Route
                    path="users"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <UsersManagement />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="users/create"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <UserCreate />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="users/:id/edit"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <UserEdit />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="users/:id"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <UserDetail />
                        </ProtectedRoute>
                    }
                />

                {/* Schedules */}
                <Route
                    path="schedules"
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                            <SchedulesManagement />
                        </ProtectedRoute>
                    }
                />
                <Route path="my-schedules" element={<MySchedules />} />

                {/* Inspections */}
                <Route path="inspections" element={<InspectionsList />} />
                <Route path="my-inspections" element={<MyInspections />} />

                {/* Reports - Supervisor & Admin only */}
                <Route
                    path="reports"
                    element={
                        <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
                            <ReportsAndAudit />
                        </ProtectedRoute>
                    }
                />

                {/* Settings - Admin only */}
                <Route
                    path="settings"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <Settings />
                        </ProtectedRoute>
                    }
                />

                {/* Audit Logs - Admin only */}
                <Route
                    path="audit-logs"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AuditLogs />
                        </ProtectedRoute>
                    }
                />

                {/* NEW ENHANCED FEATURES ROUTES */}

                {/* Damage Categories Management - Admin only */}
                <Route
                    path="damage-categories"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <DamageCategoryManagement />
                        </ProtectedRoute>
                    }
                />

                {/* Repair Approvals - Admin & Supervisor only */}
                <Route
                    path="repair-approvals"
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                            <RepairApprovalList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="repair-approvals/:id"
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                            <RepairApprovalDetail />
                        </ProtectedRoute>
                    }
                />

                {/* Temporary test route without auth for debugging */}
                <Route
                    path="test-repair-approval/:id"
                    element={<RepairApprovalDetail />}
                />

                {/* Repair Reports - All authenticated users */}
                <Route
                    path="repair-report/:approvalId"
                    element={<RepairReportForm />}
                />

                {/* My Repairs - All authenticated users */}
                <Route path="my-repairs" element={<MyRepairApprovals />} />

                {/* Enhanced Inspection Form - Teknisi only */}
                <Route
                    path="inspections/enhanced/:qrCode"
                    element={
                        <ProtectedRoute allowedRoles={['teknisi']}>
                            <InspectionFormEnhanced />
                        </ProtectedRoute>
                    }
                />

                {/* New Inspection Route - All authenticated users */}
                <Route
                    path="inspections/new"
                    element={<InspectionForm />}
                />

                {/* QR Scanner - Teknisi only */}
                <Route
                    path="scan"
                    element={
                        <ProtectedRoute allowedRoles={['teknisi']}>
                            <QRScanner />
                        </ProtectedRoute>
                    }
                />

            </Route>

            {/* Catch-all 404 - redirect to dashboard if authenticated, otherwise to welcome */}
            <Route path="*" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />} />
        </Routes>
    );
}

// Tanstack Query Client
const queryClient = new QueryClient();

function App() {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <ToastProvider>
                        <AppRoutes />
                    </ToastProvider>
                </AuthProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('app');
    if (container) {
        const root = createRoot(container);
        root.render(
            <React.StrictMode>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </React.StrictMode>
        );
    }
});
