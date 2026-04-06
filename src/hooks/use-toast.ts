import * as React from "react";
import { ToastActionElement, ToastProps } from "@/components/ui/toast";
import {
  addToast,
  updateToast,
  dismissToast,
  removeToast,
  subscribe,
} from "@/services/toast/toastStore";

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type Toast = Omit<ToasterToast, "id">;

export function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    updateToast({ ...props, id });
    
  const dismiss = () => dismissToast(id);

  addToast({
    ...props,
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismiss();
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

export function useToast() {
  const [state, setState] = React.useState<{ toasts: ToasterToast[] }>({ toasts: [] });

  React.useEffect(() => {
    return subscribe(setState);
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dismissToast(toastId),
  };
}