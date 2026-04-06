import { ToastActionElement, ToastProps } from "@/components/ui/toast";

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ToastState = {
  toasts: ToasterToast[];
};

let listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

export const TOAST_LIMIT = 1;
export const TOAST_REMOVE_DELAY = 1000000;

export const addToast = (toast: ToasterToast) => {
  memoryState = {
    ...memoryState,
    toasts: [toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
  };
  emitChange();
};

export const updateToast = (toast: Partial<ToasterToast>) => {
  memoryState = {
    ...memoryState,
    toasts: memoryState.toasts.map((t) =>
      t.id === toast.id ? { ...t, ...toast } : t
    ),
  };
  emitChange();
};

export const dismissToast = (toastId?: string) => {
  memoryState = {
    ...memoryState,
    toasts: memoryState.toasts.map((t) =>
      t.id === toastId || toastId === undefined
        ? {
            ...t,
            open: false,
          }
        : t
    ),
  };
  emitChange();
};

export const removeToast = (toastId?: string) => {
  memoryState = {
    ...memoryState,
    toasts: toastId
      ? memoryState.toasts.filter((t) => t.id !== toastId)
      : [],
  };
  emitChange();
};

const emitChange = () => {
  listeners.forEach((listener) => {
    listener(memoryState);
  });
};

export const subscribe = (listener: (state: ToastState) => void) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};