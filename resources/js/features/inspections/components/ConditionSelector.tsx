import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, FireIcon } from '@heroicons/react/24/outline';
import type { DamageCategory } from '@/types/inspection.types';

interface FormState {
    condition: 'good' | 'needs_refill' | 'expired' | 'damaged';
    notes: string;
    damage_categories: any[];
    damage_notes: string;
    needs_repair: boolean;
    repair_notes: string;
}

interface ConditionSelectorProps {
    formData: FormState;
    onChange: (data: Partial<FormState>) => void;
    damageCategories: DamageCategory[];
}

export const ConditionSelector: React.FC<ConditionSelectorProps> = ({
    formData,
    onChange,
    damageCategories,
}) => {
    const conditions = [
        { value: 'good', label: 'Baik', icon: CheckCircleIcon, color: 'green' },
        { value: 'needs_refill', label: 'Perlu Isi Ulang', icon: ExclamationTriangleIcon, color: 'yellow' },
        { value: 'expired', label: 'Kadaluarsa', icon: ExclamationTriangleIcon, color: 'orange' },
        { value: 'damaged', label: 'Rusak', icon: FireIcon, color: 'red' },
    ];

    return (
        <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kondisi APAR</h3>

            {/* Condition Options */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {conditions.map((condition) => {
                    const Icon = condition.icon;
                    const isSelected = formData.condition === condition.value;

                    return (
                        <button
                            key={condition.value}
                            type="button"
                            onClick={() => onChange({ condition: condition.value as any })}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                isSelected
                                    ? `border-${condition.color}-500 bg-${condition.color}-50`
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <div
                                    className={`p-2 rounded-lg ${
                                        isSelected ? `bg-${condition.color}-100` : 'bg-gray-100'
                                    }`}
                                >
                                    <Icon
                                        className={`h-6 w-6 ${
                                            isSelected ? `text-${condition.color}-600` : 'text-gray-600'
                                        }`}
                                    />
                                </div>
                                <span
                                    className={`font-medium ${
                                        isSelected ? `text-${condition.color}-700` : 'text-gray-700'
                                    }`}
                                >
                                    {condition.label}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Notes */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Inspeksi</label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => onChange({ notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Tambahkan catatan jika diperlukan..."
                />
            </div>

            {/* Damage Categories (if damaged) */}
            {formData.condition === 'damaged' && damageCategories.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                    <h4 className="text-sm font-semibold text-red-900 mb-3">Kategori Kerusakan</h4>
                    <div className="space-y-2">
                        {damageCategories.map((category) => (
                            <label key={category.id} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                    checked={formData.damage_categories.some((dc: any) => dc.category_id === category.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            onChange({
                                                damage_categories: [
                                                    ...formData.damage_categories,
                                                    { category_id: category.id, severity: 'medium' },
                                                ],
                                            });
                                        } else {
                                            onChange({
                                                damage_categories: formData.damage_categories.filter(
                                                    (dc: any) => dc.category_id !== category.id
                                                ),
                                            });
                                        }
                                    }}
                                />
                                <span className="text-sm text-gray-700">{category.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Repair Required */}
            {(formData.condition === 'needs_refill' ||
                formData.condition === 'expired' ||
                formData.condition === 'damaged') && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.needs_repair}
                            onChange={(e) => onChange({ needs_repair: e.target.checked })}
                            className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                        />
                        <span className="text-sm font-medium text-yellow-900">Memerlukan perbaikan segera</span>
                    </label>
                    {formData.needs_repair && (
                        <textarea
                            value={formData.repair_notes}
                            onChange={(e) => onChange({ repair_notes: e.target.value })}
                            rows={2}
                            className="mt-3 w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            placeholder="Catatan perbaikan..."
                        />
                    )}
                </div>
            )}
        </div>
    );
};
