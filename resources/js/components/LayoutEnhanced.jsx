import { useState, useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { useConfirmDialog } from "../hooks/useConfirmDialog"
import ConfirmDialog from "./ConfirmDialog"
import {
  HomeIcon,
  FireIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  QrCodeIcon,
  UserGroupIcon,
  CogIcon,
  BellIcon,
  CalendarDaysIcon,
  TagIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline"

const LayoutEnhanced = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [navigationError, setNavigationError] = useState(null)
  const { user, logout } = useAuth()
  const { showSuccess, showError } = useToast()
  const { isOpen, config, confirm, close } = useConfirmDialog()
  const location = useLocation()
  const navigate = useNavigate()

  // Handle navigation errors
  useEffect(() => {
    const handleNavigationError = (error) => {
      // Only handle actual navigation errors, not general page errors
      if (
        error &&
        error.message &&
        (error.message.includes("navigation") || error.message.includes("routing") || error.message.includes("route"))
      ) {
        setNavigationError(error.message)
        showError("Terjadi kesalahan saat berpindah halaman. Silakan coba lagi.")
      }
    }

    // Listen for navigation errors
    window.addEventListener("error", handleNavigationError)

    // Listen for unhandled promise rejections (common in React Router)
    window.addEventListener("unhandledrejection", (event) => {
      if (event.reason && event.reason.message) {
        // Only handle navigation-related errors
        if (
          event.reason.message.includes("navigation") ||
          event.reason.message.includes("routing") ||
          event.reason.message.includes("route")
        ) {
          setNavigationError(event.reason.message)
          showError("Terjadi kesalahan saat memuat halaman. Silakan coba lagi.")
        }
      }
    })

    return () => {
      window.removeEventListener("error", handleNavigationError)
      window.removeEventListener("unhandledrejection", handleNavigationError)
    }
  }, [showError])

  // Clear navigation error when location changes successfully
  useEffect(() => {
    setNavigationError(null)
  }, [location])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest(".user-menu")) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [userMenuOpen])

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Administrator"
      case "teknisi":
        return "Teknisi"
      case "supervisor":
        return "Supervisor"
      default:
        return role
    }
  }

  // Role-based navigation configuration
  const getNavigationByRole = (role) => {
    switch (role) {
      case "teknisi":
        return [
          { name: "Dashboard", href: "/dashboard", icon: HomeIcon, description: "Ringkasan inspeksi" },
          {
            name: "Jadwal Tugas",
            href: "/dashboard/my-schedules",
            icon: CalendarDaysIcon,
            description: "Jadwal inspeksi saya",
          },
          { name: "Scan QR & Inspeksi", href: "/dashboard/scan", icon: QrCodeIcon, description: "Mulai inspeksi APAR" },
          {
            name: "Riwayat Inspeksi",
            href: "/dashboard/my-inspections",
            icon: ClipboardDocumentListIcon,
            description: "Laporan inspeksi pribadi",
          },
          {
            name: "Perbaikan Saya",
            href: "/dashboard/my-repairs",
            icon: WrenchScrewdriverIcon,
            description: "Status perbaikan APAR",
          },
        ]

      case "supervisor":
        return [
          { name: "Dashboard", href: "/dashboard", icon: HomeIcon, description: "Monitoring APAR" },
          { name: "APAR", href: "/dashboard/apar", icon: FireIcon, description: "Data APAR" },
          {
            name: "Inspeksi",
            href: "/dashboard/inspections",
            icon: ClipboardDocumentListIcon,
            description: "Riwayat inspeksi",
          },
          { name: "Mobil Tangki", href: "/dashboard/tank-trucks", icon: TruckIcon, description: "Data mobil tangki" },
          {
            name: "Persetujuan Perbaikan",
            href: "/dashboard/repair-approvals",
            icon: CheckCircleIcon,
            description: "Tinjau permintaan perbaikan",
          },
          {
            name: "Laporan & Audit",
            href: "/dashboard/reports",
            icon: ChartBarIcon,
            description: "Laporan dan monitoring audit",
          },
        ]

      case "admin":
        return [
          { name: "Dashboard", href: "/dashboard", icon: HomeIcon, description: "Dashboard lengkap" },
          { name: "APAR", href: "/dashboard/apar", icon: FireIcon, description: "Manajemen data APAR" },
          { name: "Jenis APAR", href: "/dashboard/apar-types", icon: TagIcon, description: "Kelola jenis APAR" },
          {
            name: "Kategori Kerusakan",
            href: "/dashboard/damage-categories",
            icon: ExclamationTriangleIcon,
            description: "Kelola kategori kerusakan",
          },
          {
            name: "Mobil Tangki",
            href: "/dashboard/tank-trucks",
            icon: TruckIcon,
            description: "Manajemen mobil tangki",
          },
          { name: "Pengguna", href: "/dashboard/users", icon: UserGroupIcon, description: "Kelola pengguna" },
          { name: "Jadwal", href: "/dashboard/schedules", icon: BellIcon, description: "Jadwal inspeksi" },
          {
            name: "Persetujuan Perbaikan",
            href: "/dashboard/repair-approvals",
            icon: CheckCircleIcon,
            description: "Tinjau permintaan perbaikan",
          },
          {
            name: "Laporan & Audit",
            href: "/dashboard/reports",
            icon: ChartBarIcon,
            description: "Laporan dan monitoring audit",
          },
          { name: "Pengaturan", href: "/dashboard/settings", icon: CogIcon, description: "Konfigurasi sistem" },
        ]

      default:
        return [{ name: "Dashboard", href: "/dashboard", icon: HomeIcon, description: "Dashboard" }]
    }
  }

  const navigation = getNavigationByRole(user?.role)

  // Clean navigation handler
  const handleNavigation = (href, itemName) => {
    const routeExists = navigation.some((item) => item.href === href)

    if (routeExists) {
      try {
        navigate(href)
        setNavigationError(null)
      } catch (error) {
        showError(`Gagal membuka halaman ${itemName}. Silakan coba lagi.`)
      }
    } else {
      setNavigationError(`Halaman ${itemName} tidak tersedia untuk peran Anda.`)
      showError(`Halaman ${itemName} tidak tersedia untuk peran Anda.`)
    }
  }

  const handleLogout = async () => {
    try {
      // Close user menu first
      setUserMenuOpen(false)

      // Call logout function from auth context
      logout()

      // Show success message
      showSuccess("Berhasil logout dari sistem")

      // Navigate to login page
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
      showError("Gagal logout dari sistem. Silakan coba lagi.")
    }
  }

  const isActive = (href) => {
    // Dashboard is active when on dashboard or root
    if (href === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/"
    }

    // Special handling for /dashboard/apar to avoid conflict with /dashboard/apar-types
    if (href === "/dashboard/apar") {
      return (
        location.pathname === "/dashboard/apar" ||
        (location.pathname.startsWith("/dashboard/apar/") && !location.pathname.startsWith("/dashboard/apar-types"))
      )
    }

    // Special handling for /dashboard/apar-types to be exact match only
    if (href === "/dashboard/apar-types") {
      return location.pathname === "/dashboard/apar-types"
    }

    // For other routes, check if pathname starts with href
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl transform transition-all duration-300 ease-in-out">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <img src="/images/logo2.svg" alt="CAKAP FT MAOS Logo" className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CAKAP FT MAOS</h1>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      handleNavigation(item.href, item.name)
                      setSidebarOpen(false)
                    }}
                    className={`group w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive(item.href) ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                      }`}
                    />
                    <div className="text-left flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
          {/* Header */}
          <div className="flex h-16 items-center px-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <img src="/images/logo2.svg" alt="CAKAP FT MAOS Logo" className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CAKAP FT MAOS</h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href, item.name)}
                    className={`group w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive(item.href) ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                      }`}
                    />
                    <div className="text-left flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-5 w-5" />
              </button>

              {/* User menu */}
              <div className="relative user-menu">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-x-3 text-sm font-medium text-gray-900 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <UserCircleIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="hidden lg:block">{user?.name}</span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-lg bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100">
                    <div className="px-4 py-3 text-sm border-b border-gray-100">
                      <div className="font-medium text-gray-900">{user?.name}</div>
                      <div className="text-gray-500 text-xs">{user?.email}</div>
                      <div className="inline-flex items-center px-2 py-1 mt-2 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                        {getRoleDisplayName(user?.role)}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Navigation Error Display */}
            {navigationError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error Navigasi</h3>
                    <div className="mt-1 text-sm text-red-700">{navigationError}</div>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setNavigationError(null)}
                        className="bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Outlet />
          </div>
        </main>
      </div>

      <ConfirmDialog isOpen={isOpen} config={config} onConfirm={confirm} onClose={close} />
    </>
  )
}

export default LayoutEnhanced
