import toast from "react-hot-toast";

export function successToast(text) {
  toast.success(text);
}

export function errorToast(text) {
  toast.error(text);
}
