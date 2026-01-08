import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";

const Unauthorized = () => {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const { user } = useAuth();

  const requiredRolesRaw = (search as any).requiredRoles as string | undefined;
  
  const getRoleName = (role: string) => {
    switch (role.trim()) {
      case 'admin': return 'Administrator';
      case 'supervisor': return 'Supervisor';
      case 'teknisi': return 'Teknisi';
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const getMessage = () => {
    if (!requiredRolesRaw) return 'Halaman ini hanya dapat diakses oleh Administrator.';
    
    const roles = requiredRolesRaw.split(',').map(getRoleName);
    if (roles.length === 1) return `Halaman ini hanya dapat diakses oleh ${roles[0]}.`;
    return `Halaman ini hanya dapat diakses oleh ${roles.join(' atau ')}.`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-red-100 mb-6">
          <ShieldExclamationIcon className="h-12 w-12 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Akses Ditolak
        </h1>
        
        <p className="text-lg text-gray-600 mb-6">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Role Anda:</span> {user?.role || 'Unknown'}
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            {getMessage()}
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate({ to: "/" as any })}
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Kembali ke Dashboard
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Kembali ke Halaman Sebelumnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
