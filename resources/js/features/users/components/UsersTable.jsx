import React from 'react';
import { Link } from '@tanstack/react-router';
import { 
    UserIcon, 
    EyeIcon, 
    PencilIcon, 
    TrashIcon,
    ShieldCheckIcon,
    UserGroupIcon,
    LockOpenIcon,
    PaperAirplaneIcon
} from '@heroicons/react/24/outline';

const UsersTable = ({ users, onEdit, onDelete, onUnblock, onResendActivation }) => {
    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return <ShieldCheckIcon className="h-4 w-4 mr-1 text-white" />;
            case 'supervisor':
                return <UserGroupIcon className="h-4 w-4 mr-1 text-white" />;
            case 'teknisi':
                return <UserIcon className="h-4 w-4 mr-1 text-[#041562]" />;
            default:
                return <UserIcon className="h-4 w-4 mr-1 text-slate-500" />;
        }
    };

    const getRoleDisplayName = (role) => {
        switch (role) {
            case 'admin':
                return 'Administrator';
            case 'supervisor':
                return 'Supervisor';
            case 'teknisi':
                return 'Teknisi';
            default:
                return role;
        }
    };

    const getRoleBadgeClasses = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-[#041562] text-white';
            case 'supervisor':
                return 'bg-[#11468F] text-white';
            case 'teknisi':
                return 'bg-[#EEEEEE] text-[#041562]';
            default:
                return 'bg-[#EEEEEE] text-slate-700';
        }
    };

    if (users.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-[6px] border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-[6px] flex items-center justify-center mx-auto mb-3">
                    <UserIcon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Tidak ada pengguna ditemukan</h3>
                <p className="mt-1 text-xs text-slate-500">
                    Coba sesuaikan filter atau tambahkan pengguna baru.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[6px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Daftar Pengguna</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Total {users.length} pengguna terdaftar di sistem
                    </p>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Pengguna
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Kontak
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {users.map((user) => (
                            <tr 
                                key={user.id} 
                                className="hover:bg-slate-50/80 transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                         <div className="flex-shrink-0 h-10 w-10">
                                             <div className="h-10 w-10 rounded-[6px] bg-[#041562] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                                 {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                             </div>
                                         </div>
                                         <div className="ml-3">
                                             <div className="text-sm font-bold text-slate-900">
                                                 {user.name}
                                             </div>
                                             <div className="text-xs text-slate-500">
                                                 ID: #{user.id}
                                             </div>
                                         </div>
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                     <span className={`inline-flex items-center px-2.5 py-1 rounded-[3px] text-xs font-semibold tracking-wider uppercase ${getRoleBadgeClasses(user.role)}`}>
                                         {getRoleIcon(user.role)}
                                         {getRoleDisplayName(user.role)}
                                     </span>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                     <div className="text-sm font-medium text-slate-900">{user.email}</div>
                                     <div className="text-xs text-slate-500">{user.phone || '-'}</div>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                     {(() => {
                                         if (!user.email_verified_at) {
                                             return (
                                                 <span className="inline-flex items-center px-2.5 py-1 rounded-[3px] text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                                     Menunggu Aktivasi
                                                 </span>
                                             );
                                         }
                                         if (user.is_active) {
                                             return (
                                                 <span className="inline-flex items-center px-2.5 py-1 rounded-[3px] text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                     Aktif
                                                 </span>
                                             );
                                         }
                                         return (
                                             <span className="inline-flex items-center px-2.5 py-1 rounded-[3px] text-xs font-semibold bg-rose-50 text-[#DA1212] border border-rose-200">
                                                 Nonaktif
                                             </span>
                                         );
                                     })()}
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                     <div className="flex items-center justify-end space-x-1.5">
                                         <Link
                                             to={`/users/${user.id}`}
                                             className="p-1.5 rounded-[6px] text-slate-600 hover:text-[#041562] hover:bg-slate-100 border border-slate-200 transition-colors"
                                             title="Lihat Detail"
                                         >
                                             <EyeIcon className="h-4 w-4" />
                                         </Link>
                                         <button
                                             onClick={() => onEdit(user)}
                                             className="p-1.5 rounded-[6px] text-slate-600 hover:text-[#041562] hover:bg-slate-100 border border-slate-200 transition-colors"
                                             title="Edit Pengguna"
                                         >
                                             <PencilIcon className="h-4 w-4" />
                                         </button>
                                         {/* Unblock Button */}
                                         {user.blocked_until && new Date(user.blocked_until) > new Date() && (
                                             <button
                                                 onClick={() => onUnblock(user)}
                                                 className="p-1.5 rounded-[6px] text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
                                                 title="Buka Blokir"
                                             >
                                                 <LockOpenIcon className="h-4 w-4" />
                                             </button>
                                         )}

                                         {/* Resend Activation Button */}
                                         {onResendActivation && !user.email_verified_at && (
                                             <button
                                                 onClick={() => onResendActivation(user)}
                                                 className="p-1.5 rounded-[6px] text-[#11468F] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                                                 title="Kirim Ulang Aktivasi"
                                             >
                                                 <PaperAirplaneIcon className="h-4 w-4" />
                                             </button>
                                         )}

                                         {user.role !== 'admin' && (
                                             <button
                                                 onClick={() => onDelete(user.id)}
                                                 className="p-1.5 rounded-[6px] text-[#DA1212] bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                                                 title="Hapus Pengguna"
                                             >
                                                 <TrashIcon className="h-4 w-4" />
                                             </button>
                                         )}
                                     </div>
                                 </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersTable;

