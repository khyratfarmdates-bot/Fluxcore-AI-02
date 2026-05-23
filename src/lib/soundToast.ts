import { toast as originalToast } from 'sonner';
import { audioSystem } from './audioSystem';

export const toast = Object.assign(
  (msg: string | React.ReactNode, data?: any) => {
    audioSystem.playNotification();
    return originalToast(msg, data);
  },
  {
    success: (msg: string | React.ReactNode, data?: any) => {
      audioSystem.playSuccess();
      return originalToast.success(msg, data);
    },
    error: (msg: string | React.ReactNode, data?: any) => {
      audioSystem.playError();
      return originalToast.error(msg, data);
    },
    warning: (msg: string | React.ReactNode, data?: any) => {
      audioSystem.playWarning();
      return originalToast.warning(msg, data);
    },
    info: (msg: string | React.ReactNode, data?: any) => {
      audioSystem.playNotification();
      return originalToast.info(msg, data);
    },
    promise: originalToast.promise,
    dismiss: originalToast.dismiss,
  }
);
