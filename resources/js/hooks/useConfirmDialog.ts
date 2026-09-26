import { useState, useCallback } from 'react';

export interface ConfirmDialogOptions {
    title?: string;
    message?: string;
    type?: 'warning' | 'error' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
    confirmButtonColor?: 'red' | 'blue' | 'green' | 'yellow' | string;
    showCancel?: boolean;
    loading?: boolean;
    isLoading?: boolean;
    [key: string]: any;
}

export interface ConfirmDialogConfig extends ConfirmDialogOptions {
    onConfirm?: () => void;
    onCancel?: () => void;
}

export interface UseConfirmDialogReturn {
    isOpen: boolean;
    config: ConfirmDialogConfig;
    confirm: (options?: ConfirmDialogOptions) => Promise<boolean>;
    close: () => void;
}

export const useConfirmDialog = (): UseConfirmDialogReturn => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [config, setConfig] = useState<ConfirmDialogConfig>({});

    const confirm = useCallback((options: ConfirmDialogOptions = {}): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfig({
                ...options,
                onConfirm: () => {
                    setIsOpen(false);
                    resolve(true);
                },
                onCancel: () => {
                    setIsOpen(false);
                    resolve(false);
                }
            });
            setIsOpen(true);
        });
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    return {
        isOpen,
        config,
        confirm,
        close
    };
};

export default useConfirmDialog;
