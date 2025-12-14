import React from 'react';
// This is a placeholder for potential future context-based auth state.
// Currently, useAuth hook relies on localStorage, so this is a pass-through.
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};