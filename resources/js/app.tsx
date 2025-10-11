import React from 'react';
import { createRoot } from 'react-dom/client';
import {
    createRouter,
    RouterProvider,
    Outlet,
    redirect,
    NotFoundRoute,
    createRoute,
    createRootRouteWithContext,
    CatchBoundary,
    ErrorComponent,
    ErrorComponentProps,
} from '@tanstack/react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import CSS
import '../css/app.css';

// Import Layout
import LayoutEnhanced from './components/LayoutEnhanced'; // Make sure this component renders <Outlet />

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

// Import pages (no changes needed in page components themselves)
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import DashboardEnhanced from './pages/DashboardEnhanced';
import AparList from './pages/AparList';
import AparDetail from './pages/AparDetail';
import AparCreate from './pages/AparCreate';
import AparEdit from './pages/AparEdit';
import TankTruckList from './pages/TankTruckList';
import TankTruckDetail from './pages/TankTruckDetail';
import TankTruckEdit from './pages/TankTruckEdit';
import UsersManagement from './pages/UsersManagement';
import UserCreate from './pages/UserCreate';
import UserEdit from './pages/UserEdit';
import UserDetail from './pages/UserDetail';
import InspectionFormEnhanced from './pages/InspectionFormEnhanced';
import InspectionForm from './pages/InspectionForm';
import QRScanner from './components/QRScanner';
import MyInspections from './pages/MyInspections';
import MySchedules from './pages/MySchedules';
import InspectionsList from './pages/InspectionsList';
import SchedulesManagement from './pages/SchedulesManagement';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import ReportsAndAudit from './pages/ReportsAndAudit';
import AparTypeManagement from './pages/AparTypeManagement';
import DamageCategoryManagement from './pages/DamageCategoryManagement';
import RepairApprovalList from './pages/RepairApprovalList';
import RepairApprovalDetail from './pages/RepairApprovalDetail';
import RepairReportForm from './pages/RepairReportForm';
import MyRepairApprovals from './pages/MyRepairApprovals';
import Loading from './components/Loading';
import ErrorBoundary from './components/ErrorBoundary';

interface RouterContext {
    auth: ReturnType<typeof useAuth>;
}

// Tanstack Query Client
const queryClient = new QueryClient();

const rootRoute = createRootRouteWithContext<RouterContext>()({
    component: () => (
        <>
            <Outlet />
            <TanStackRouterDevtools />
        </>
    ),
    notFoundComponent: () => (
        <div className="p-4">
            <h2 className="text-xl font-bold">404 - Page Not Found</h2>
            <p>The page you were looking for does not exist.</p>
        </div>)
});

// Public routes
const welcomeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/welcome',
    component: Welcome,
});

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: Login,
    beforeLoad: ({ context }) => {
        // If the user is already logged in, redirect them away from the login page
        if (context.auth.user) {
            throw redirect({ to: '/' });
        }
    },
});


const authenticatedRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'authenticated',
    component: LayoutEnhanced,
    beforeLoad: ({ context, location }) => {
        if (!context.auth.user) {
            throw redirect({
                to: '/welcome',
                search: {
                    // Keep track of where the user was trying to go
                    redirect: location.href,
                },
            });
        }
    },
});

// Dashboard Route (Index route - renders at '/')
const dashboardRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: '/',
    component: DashboardEnhanced,
});

// A helper function for role-based authorization
const checkRoles = (allowedRoles: string[]) => ({ context }: { context: RouterContext }) => {
    if (!allowedRoles.includes(context.auth.user?.role ?? "")) {
        // Todo: redirect to unauthorized page
        alert('Access Denied: You do not have the required permissions.');
        throw redirect({ to: '/welcome' });
    }
};

// APAR Routes
const aparRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'apar',
    beforeLoad: checkRoles(['admin', 'supervisor']),
    component: AparList,
});
const aparCreateRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'apar/create',
    beforeLoad: checkRoles(['admin', 'supervisor']),
    component: AparCreate,
});
const aparDetailRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'apar/$id',
    beforeLoad: checkRoles(['admin', 'supervisor']),
    component: AparDetail,
});
const aparEditRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'apar/$id/edit',
    beforeLoad: checkRoles(['admin', 'supervisor']),
    component: AparEdit,
});

// APAR Type Management Routes
const aparTypesRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'apar-types',
    beforeLoad: checkRoles(['admin']),
    component: AparTypeManagement,
});

// Damage Category Management Routes
const damageCategoriesRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'damage-categories',
    beforeLoad: checkRoles(['admin']),
    component: DamageCategoryManagement,
});

// Tank Truck Routes
const tankTrucksRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'tank-trucks',
    beforeLoad: checkRoles(['admin', 'supervisor']),
    component: TankTruckList,
});
const tankTruckDetailRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'tank-trucks/$id',
    beforeLoad: checkRoles(['admin', 'supervisor']),
    component: TankTruckDetail,
});
const tankTruckEditRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'tank-trucks/$id/edit',
    beforeLoad: checkRoles(['admin', 'supervisor']),
    component: TankTruckEdit,
});

// User Management Routes (Admin only)
const usersRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'users',
    beforeLoad: checkRoles(['admin']),
    component: UsersManagement,
});
const userCreateRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'users/create',
    beforeLoad: checkRoles(['admin']),
    component: UserCreate,
});
const userDetailRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'users/$id',
    beforeLoad: checkRoles(['admin']),
    component: UserDetail,
});
const userEditRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'users/$id/edit',
    beforeLoad: checkRoles(['admin']),
    component: UserEdit,
});

const schedulesRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'schedules',
    beforeLoad: checkRoles(['admin', 'supervisor']),
    component: SchedulesManagement,
});
const mySchedulesRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'my-schedules',
    component: MySchedules, // All authenticated users can see this
});

// Inspection Routes
const inspectionsRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'inspections',
    beforeLoad: checkRoles(['admin', 'supervisor']),
    component: InspectionsList,
});

const newInspectionRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'inspections/new/{-$qrCode}',
    beforeLoad: checkRoles(['admin', 'supervisor']),
    component: InspectionForm,
});

const newInspectionFromQRRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'inspections/enhanced/$qrCode',
    beforeLoad: checkRoles(['teknisi']),
    component: InspectionFormEnhanced,
});

// const inspectionsDetailRoute = createRoute({
//     getParentRoute: () => authenticatedRoute,
//     path: 'inspections/$id',
//     beforeLoad: checkRoles(['admin', 'supervisor']),
//     component: InspectionFormEnhanced,
// });

const myInspectionsRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'my-inspections',
    component: MyInspections, // All authenticated users can see this
});

// QR Scanner Route
const scanRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'scan',
    beforeLoad: checkRoles(['teknisi']),
    component: QRScanner,
});

// Repair Approval Routes
const repairApprovalsRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'repair-approvals',
    beforeLoad: checkRoles(['admin', 'supervisor']),
    component: RepairApprovalList,
});
const repairApprovalDetailRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'repair-approvals/$id',
    beforeLoad: checkRoles(['admin', 'supervisor']),
    component: RepairApprovalDetail,
});
const myRepairsRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'my-repairs',
    component: MyRepairApprovals, // All authenticated users can see this
});

// Reports and Audit Route
const reportsRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'reports',
    beforeLoad: checkRoles(['admin', 'supervisor']),
    component: ReportsAndAudit,
});

// Settings Route
const settingsRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'settings',
    beforeLoad: checkRoles(['admin']),
    component: Settings,
});

const routeTree = rootRoute.addChildren([
    welcomeRoute,
    loginRoute,
    authenticatedRoute.addChildren([
        dashboardRoute,
        aparRoute,
        aparCreateRoute,
        aparDetailRoute,
        aparEditRoute,
        aparTypesRoute,
        damageCategoriesRoute,
        tankTrucksRoute,
        tankTruckDetailRoute,
        tankTruckEditRoute,
        usersRoute,
        userCreateRoute,
        userDetailRoute,
        userEditRoute,
        schedulesRoute,
        mySchedulesRoute,
        inspectionsRoute,
        newInspectionRoute,
        newInspectionFromQRRoute,
        myInspectionsRoute,
        scanRoute,
        repairApprovalsRoute,
        repairApprovalDetailRoute,
        myRepairsRoute,
        reportsRoute,
        settingsRoute,
    ]),
]);


function App() {
    return (
        <QueryClientProvider client={queryClient}>
            {/* AuthProvider depends on QueryClientProvider */}
            <AuthProvider>
                <ToastProvider>
                    <RouterSetup />
                </ToastProvider>
            </AuthProvider>

            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>

    );
}


function RouterSetup() {
    const auth = useAuth();

    if (auth.isInitialLoading) {
        return <Loading />;
    }

    const router = createRouter({
        routeTree,
        context: {
            auth, // The router context now has the authenticated state.
        },
        defaultErrorComponent: ({ error }: ErrorComponentProps) => (
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
                            window.location.href = '/';
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                        Kembali ke Dashboard
                    </button>
                </div>
            </div>
        ),
    });

    return <RouterProvider router={router} />;
}




document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('app');
    if (container) {
        const root = createRoot(container);
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
    }
});

// Declare the module for the router's context
// type-safety in `beforeLoad` functions
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof createRouter
    }

}