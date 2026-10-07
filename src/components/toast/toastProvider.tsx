import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { ToastContext, type ErrorNotification } from './toastContext';
import { useTranslation } from 'react-i18next';

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

  const showError = useCallback((notification: ErrorNotification) => {
    setNotifications((current) => {
      const remaining = current.filter((item) => item.id !== notification.id);
      return [...remaining, notification];
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(() => ({ showError, dismiss }), [showError, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position="top-end" containerPosition="fixed" className="p-3">
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            show
            autohide={false}
            onClose={() => dismiss(notification.id)}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <Toast.Header closeLabel={t('common.close')}>
              <strong className="me-auto">{notification.title}</strong>
            </Toast.Header>
            <Toast.Body>{notification.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}
