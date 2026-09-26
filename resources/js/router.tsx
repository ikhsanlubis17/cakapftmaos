import React, { useEffect } from "react";
import {
    createRouter,
    RouterProvider,
    Outlet,
    redirect,
    createRoute,
    createRootRouteWithContext,
    ErrorComponentProps,
} from "@tanstack/react-router";
import { useAuth } from "./contexts/AuthContext";
import { tokenStorage } from "./services/tokenStorage";
import { userQueryKey, User } from "./hooks/useAuthApi";
import { queryClient } from "./queryClient";

// Import Layout
import LayoutEnhanced from "./components/layout/LayoutEnhanced";

import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

// Import pages from feature-based structure
import Login from "./features/auth/pages/Login";
import Welcome from "./features/auth/pages/Welcome";
import Profile from "./features/auth/pages/Profile";
import ResetPassword from "./features/auth/pages/ResetPassword";
import ActivateAccount from "./features/auth/pages/ActivateAccount";

import DashboardEnhanced from "./features/dashboard/pages/DashboardEnhanced";
import AparList from "./features/apar/pages/AparList";
import AparDetail from "./features/apar/pages/AparDetail";
import AparCreate from "./features/apar/pages/AparCreate";
import AparEdit from "./features/apar/pages/AparEdit";
import TankTruckList from "./features/tank-trucks/pages/TankTruckList";
import TankTruckDetail from "./features/tank-trucks/pages/TankTruckDetail";
import TankTruckEdit from "./features/tank-trucks/pages/TankTruckEdit";
import UsersManagement from "./features/users/pages/UsersManagement";
import UserCreate from "./features/users/pages/UserCreate";
import UserEdit from "./features/users/pages/UserEdit";
import UserDetail from "./features/users/pages/UserDetail";
import InspectionFormEnhanced from "./features/inspections/pages/InspectionFormEnhanced";
import QRScanner from "./components/common/QRScanner";
import MyInspections from "./features/inspections/pages/MyInspections";
import MySchedules from "./features/schedules/pages/MySchedules";
import InspectionsList from "./features/inspections/pages/InspectionsList";
import SchedulesManagement from "./features/schedules/pages/SchedulesManagement";
import Settings from "./features/settings/pages/Settings";
import ReportsAndAudit from "./features/reports/pages/ReportsAndAudit";
import AparTypeManagement from "./features/apar/pages/AparTypeManagement";
import DamageCategoryManagement from "./features/apar/pages/DamageCategoryManagement";
import RepairApprovalList from "./features/repairs/pages/RepairApprovalList";
import AdminRepairApprovals from "./features/repairs/pages/AdminRepairApprovals";
import RepairApprovalDetail from "./features/repairs/pages/RepairApprovalDetail";
import RepairReportForm from "./features/repairs/pages/RepairReportForm";
import MyRepairApprovals from "./features/repairs/pages/MyRepairApprovals";
import InspectionReviewPage from "./features/inspections/pages/InspectionReviewPage";
import RepairReportReviewPage from "./features/repairs/pages/RepairReportReviewPage";
import Loading from "./components/ui/Loading";
import Unauthorized from "./features/auth/pages/Unauthorized";

export interface RouterContext {
    auth: ReturnType<typeof useAuth>;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
    component: () => (
        <>
            <Outlet />
            <TanStackRouterDevtools />
        </>
    ),
    notFoundComponent: () => (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-[6px] p-8 shadow-sm text-center max-w-md w-full">
                <div className="mx-auto h-14 w-14 rounded-[6px] bg-[#041562] text-white flex items-center justify-center text-xl font-bold font-mono mb-4 shadow-sm">
                    404
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Halaman Tidak Ditemukan</h2>
                <p className="text-xs text-slate-500 mb-6">Halaman yang Anda tuju tidak ditemukan atau telah dipindahkan.</p>
                <a
                    href="/"
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-[#11468F] hover:bg-[#0d3873] text-white rounded-[6px] text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
                >
                    Kembali ke Beranda
                </a>
            </div>
        </div>
    ),
});

/**
 * Safely resolve user from context or direct queryClient cache to avoid
 * race conditions when navigating immediately after login/logout before
 * React context re-renders RouterProvider.
 */
const getResolvedAuthUser = (context?: RouterContext): User | null => {
    if (context?.auth?.user) {
        return context.auth.user;
    }
    const cachedUser = queryClient.getQueryData<User>(userQueryKey);
    if (cachedUser) {
        return cachedUser;
    }
    return null;
};

// Public routes
const welcomeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/welcome",
    component: Welcome,
    beforeLoad: ({ context }) => {
        const user = getResolvedAuthUser(context);
        const hasToken = !!tokenStorage.get();
        // If already authenticated, redirect to dashboard
        if (user && hasToken) {
            throw redirect({ to: "/" });
        }
    },
});

const activateAccountRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/activate",
    component: ActivateAccount,
    beforeLoad: () => {
        // Purge any preexisting session to prevent cross-account contamination during activation
        tokenStorage.remove();
        queryClient.removeQueries({ queryKey: userQueryKey });
    },
});

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: Login,
    beforeLoad: ({ context }) => {
        // If navigating to login explicitly from activation, reset, logout, or with an email parameter,
        // purge old session tokens and stay on login page.
        const search = typeof window !== "undefined" ? window.location.search : "";
        const params = new URLSearchParams(search);
        if (
            params.get("activated") ||
            params.get("reset") ||
            params.get("email") ||
            params.get("logout")
        ) {
            tokenStorage.remove();
            queryClient.removeQueries({ queryKey: userQueryKey });
            return;
        }

        const user = getResolvedAuthUser(context);
        const hasToken = !!tokenStorage.get();
        // If the user is actively authenticated, redirect them away from login page
        if (user && hasToken) {
            throw redirect({ to: "/" });
        }
    },
});

const resetPasswordRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/reset-password",
    component: ResetPassword,
    beforeLoad: () => {
        // Purge any preexisting session to prevent cross-account contamination during password reset
        tokenStorage.remove();
        queryClient.removeQueries({ queryKey: userQueryKey });
    },
});

const authenticatedRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: "authenticated",
    component: LayoutEnhanced,
    beforeLoad: ({ context, location }) => {
        const user = getResolvedAuthUser(context);
        const hasToken = !!tokenStorage.get();

        if (!user && !hasToken) {
            throw redirect({
                to: "/welcome",
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
    path: "/",
    component: DashboardEnhanced,
});

// Profile Route
const profileRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "profile",
    component: Profile,
});

// Unauthorized Route
const unauthorizedRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "unauthorized",
    component: Unauthorized,
});

// A helper function for role-based authorization
const checkRoles =
    (allowedRoles: string[]) =>
        ({ context }: { context: RouterContext }) => {
            const user = getResolvedAuthUser(context);
            if (!user) {
                // If token exists, user profile might still be loading in background
                if (tokenStorage.get()) return;
                throw redirect({ to: "/unauthorized" });
            }
            if (!allowedRoles.includes(user.role ?? "")) {
                throw redirect({ to: "/unauthorized" });
            }
        };

// APAR Routes (Admin only)
const aparRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "apar",
    beforeLoad: checkRoles(["admin", "supervisor"]),
    component: AparList,
});
const aparCreateRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "apar/create",
    beforeLoad: checkRoles(["admin"]),
    component: AparCreate,
});
const aparDetailRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "apar/$id",
    beforeLoad: checkRoles(["admin", "supervisor"]),
    component: AparDetail,
});
const aparEditRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "apar/$id/edit",
    beforeLoad: checkRoles(["admin"]),
    component: AparEdit,
});

// APAR Type Management Routes
const aparTypesRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "apar-types",
    beforeLoad: checkRoles(["admin"]),
    component: AparTypeManagement,
});

// Damage Category Management Routes
const damageCategoriesRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "damage-categories",
    beforeLoad: checkRoles(["admin"]),
    component: DamageCategoryManagement,
});

// Tank Truck Routes (Admin only)
const tankTrucksRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "tank-trucks",
    beforeLoad: checkRoles(["admin"]),
    component: TankTruckList,
});
const tankTruckDetailRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "tank-trucks/$id",
    beforeLoad: checkRoles(["admin"]),
    component: TankTruckDetail,
});
const tankTruckEditRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "tank-trucks/$id/edit",
    beforeLoad: checkRoles(["admin"]),
    component: TankTruckEdit,
});

// User Management Routes (Admin only)
const usersRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "users",
    beforeLoad: checkRoles(["admin"]),
    component: UsersManagement,
});
const userCreateRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "users/create",
    beforeLoad: checkRoles(["admin"]),
    component: UserCreate,
});
const userDetailRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "users/$id",
    beforeLoad: checkRoles(["admin"]),
    component: UserDetail,
});
const userEditRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "users/$id/edit",
    beforeLoad: checkRoles(["admin"]),
    component: UserEdit,
});

const schedulesRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "schedules",
    beforeLoad: checkRoles(["admin"]),
    component: SchedulesManagement,
});
const mySchedulesRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "my-schedules",
    component: MySchedules, // All authenticated users can see this
});

// Inspection Routes
const inspectionsRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "inspections",
    beforeLoad: checkRoles(["admin", "supervisor"]),
    component: InspectionsList,
});

const newInspectionRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "inspections/new/{-$qrCode}",
    beforeLoad: checkRoles(["supervisor", "teknisi"]),
    component: InspectionFormEnhanced,
});

const newInspectionFromQRRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "inspections/enhanced/$qrCode",
    beforeLoad: checkRoles(["supervisor", "teknisi"]),
    component: InspectionFormEnhanced,
});

const myInspectionsRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "my-inspections",
    component: MyInspections, // All authenticated users can see this
});

// QR Scanner Route
const scanRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "scan",
    beforeLoad: checkRoles(["supervisor", "teknisi"]),
    component: QRScanner,
});

// Repair Approval Routes
const repairApprovalsRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "repair-approvals",
    beforeLoad: checkRoles(["admin", "supervisor"]),
    component: () => {
        const { user } = useAuth();
        return user?.role === "admin" ? (
            <AdminRepairApprovals />
        ) : (
            <RepairApprovalList />
        );
    },
});

// Detail route matching /repair-approval/$id (used by MyRepairApprovals & RepairApprovalList)
const repairApprovalDetailRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "repair-approval/$id",
    beforeLoad: checkRoles(["admin", "supervisor", "teknisi"]),
    component: RepairApprovalDetail,
});

// Alias for plural format /repair-approvals/$id
const repairApprovalsDetailAliasRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "repair-approvals/$id",
    beforeLoad: checkRoles(["admin", "supervisor", "teknisi"]),
    component: RepairApprovalDetail,
});

// Legacy /view/$id alias for backward compatibility
const legacyViewRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "view/$id",
    beforeLoad: checkRoles(["admin", "supervisor", "teknisi"]),
    component: RepairApprovalDetail,
});

const myRepairsRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "my-repairs",
    beforeLoad: checkRoles(["teknisi"]),
    component: MyRepairApprovals,
});

// Repair Report Form Route (Technician submits repair report)
const repairReportFormRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "repair-report/$approvalId",
    beforeLoad: checkRoles(["teknisi"]),
    component: RepairReportForm,
});

// Inspection Review Route (Supervisor only)
const inspectionReviewRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "inspections/review",
    beforeLoad: checkRoles(["admin", "supervisor"]),
    component: InspectionReviewPage,
});

// Repair Report Review Route (Supervisor only)
const repairReportReviewRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "repair-reports/review",
    beforeLoad: checkRoles(["admin", "supervisor"]),
    component: RepairReportReviewPage,
});

// Repair Reports Index Route (Supervisor & Admin alias)
const repairReportsIndexRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "repair-reports",
    beforeLoad: checkRoles(["admin", "supervisor"]),
    component: RepairReportReviewPage,
});

// Reports and Audit Route
const reportsRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "reports",
    beforeLoad: checkRoles(["admin", "supervisor"]),
    component: ReportsAndAudit,
});

// Settings Route
const settingsRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: "settings",
    beforeLoad: checkRoles(["admin"]),
    component: Settings,
});

const routeTree = rootRoute.addChildren([
    welcomeRoute,
    loginRoute,
    resetPasswordRoute,
    activateAccountRoute,
    authenticatedRoute.addChildren([
        dashboardRoute,
        profileRoute,
        unauthorizedRoute,
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
        repairApprovalsDetailAliasRoute,
        legacyViewRoute,
        myRepairsRoute,
        repairReportFormRoute,
        inspectionReviewRoute,
        repairReportReviewRoute,
        repairReportsIndexRoute,
        reportsRoute,
        settingsRoute,
    ]),
]);

export const router = createRouter({
    routeTree,
    context: {
        auth: undefined!, // Injected reactively by RouterProvider
    },
    defaultErrorComponent: ({ error }: ErrorComponentProps) => (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="text-center bg-white border border-slate-200 rounded-[6px] p-8 shadow-sm max-w-md w-full">
                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-[6px] bg-[#041562] text-white mb-4">
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                    Terjadi Kesalahan
                </h2>
                <p className="text-slate-500 text-xs mb-6">
                    Maaf, terjadi kesalahan saat memuat halaman ini.
                </p>
                <button
                    onClick={() => {
                        window.location.href = "/";
                    }}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-[6px] text-white bg-[#11468F] hover:bg-[#0d3873] shadow-sm transition-colors"
                >
                    Kembali ke Dashboard
                </button>
            </div>
        </div>
    ),
});

export function RouterSetup() {
    const auth = useAuth();

    // Re-evaluate routes and beforeLoad when user logs in or out
    useEffect(() => {
        router.invalidate();
    }, [auth.user, auth.isAuthenticated, auth.token]);

    if (auth.isInitialLoading) {
        return <Loading />;
    }

    return <RouterProvider router={router} context={{ auth }} />;
}

// Declare the module for the router's context
// type-safety in `beforeLoad` functions
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}
