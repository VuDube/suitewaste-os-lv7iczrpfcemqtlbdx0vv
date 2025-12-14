import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen bg-industrial-black flex items-center justify-center text-neon-green">
        <p className="text-2xl font-mono animate-pulse">AUTHENTICATING...</p>
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};