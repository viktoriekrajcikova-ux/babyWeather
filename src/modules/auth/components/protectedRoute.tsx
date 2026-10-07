import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const { session } = useAuth();

  if (session === undefined) {
    return <div>{t('common.loading')}</div>;
  }

  if (session === null) {
    return <Navigate to="/login" replace />;
  }

  return <Fragment key={session.user.id}>{children}</Fragment>;
};

export default ProtectedRoute;
