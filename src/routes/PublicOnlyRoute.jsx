import { Navigate, Outlet } from "react-router-dom";
import {
  getAuthenticatedRole,
  getRoleHomePath,
} from "../features/auth/roleSession";

export default function PublicOnlyRoute() {
  const activeRole = getAuthenticatedRole();

  if (activeRole) {
    return <Navigate to={getRoleHomePath(activeRole)} replace />;
  }

  return <Outlet />;
}
