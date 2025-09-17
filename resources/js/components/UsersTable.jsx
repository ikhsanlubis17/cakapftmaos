import React from 'react';
import { Link } from 'react-router-dom';
import { 
    UserIcon, 
    EyeIcon, 
    PencilIcon, 
    TrashIcon,
    ShieldCheckIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

const UsersTable = ({ users, onEdit, onDelete }) => {
    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return <ShieldCheckIcon className="h-5 w-5 text-red-500" />;
            case 'supervisor':
                return <UserGroupIcon className="h-5 w-5 text-blue-500" />;
            case 'teknisi':
                return <UserIcon className="h-5 w-5 text-green-500" />;
            default:
                return <UserIcon className="h-5 w-5 text-gray-500" />;
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

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'supervisor':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'teknisi':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (users.length === 0) {
        return (
            <div className="text-center py-12">
                <UserIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada pengguna</h3>
                <p className="mt-2 text-sm text-gray-500">
                    Mulai dengan menambahkan pengguna pertama.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h3 className="text-lg font-semibold text-gray-900">Daftar Pengguna</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Total {users.length} pengguna ditemukan
                </p>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Pengguna
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Kontak
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user, index) => (
                            <tr 
                                key={user.id} 
                                className={`hover:bg-gray-50 transition-all duration-150 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                }`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-12 w-12">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-sm">
                                                <UserIcon className="h-6 w-6 text-gray-600" />
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {user.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                ID: {user.id}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {getRoleIcon(user.role)}
                                        <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                                            {getRoleDisplayName(user.role)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 font-medium">{user.email}</div>
                                    <div className="text-sm text-gray-500">{user.phone || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                        user.is_active 
                                            ? 'bg-green-100 text-green-800 border-green-200' 
                                            : 'bg-red-100 text-red-800 border-red-200'
                                    }`}>
                                        <span className={`w-2 h-2 rounded-full mr-2 ${
                                            user.is_active ? 'bg-green-400' : 'bg-red-400'
                                        }`}></span>
                                        {user.is_active ? 'Aktif' : 'Tidak Aktif'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-2">
                                                                                                                                <Link
                                            to={`/dashboard/users/${user.id}`}
                                            className="action-btn action-btn-view"
                                            title="Lihat Detail"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                        </Link>
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="action-btn action-btn-edit"
                                            title="Edit Pengguna"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                        {user.role !== 'admin' && (
                                            <button
                                                onClick={() => onDelete(user.id)}
                                                className="action-btn action-btn-delete"
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
