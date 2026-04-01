import { Navigate, Outlet, useLocation } from "react-router-dom";
import {
  getAuthenticatedRole,
  getRoleHomePath,
  getRoleLoginPath,
  hasRoleSession,
} from "../features/auth/roleSession";

export default function ProtectedRoute({ role }) {
  const location = useLocation();
  const activeRole = getAuthenticatedRole();

  if (hasRoleSession(role)) {
    return <Outlet />;
  }

  if (activeRole) {
    return (
      <Navigate
        to={getRoleHomePath(activeRole)}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return (
    <Navigate
      to={getRoleLoginPath(role)}
      replace
      state={{ from: location.pathname }}
    />
  );
}
