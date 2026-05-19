import { toast } from "react-hot-toast";

export function notifySuccess(message) {
  toast.success(message, {
    duration: 3000,
  });
}

export function notifyError(message) {
  toast.error(message, {
    duration: 4000,
  });
}
