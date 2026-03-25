"use client";

import { createContext, useContext } from "react";

export const ADMIN_TYPES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  GLOBAL_ADMIN: "GLOBAL_ADMIN",
  COUNTRY_ADMIN: "COUNTRY_ADMIN",
};

export const AdminPermissionContext = createContext({
  adminType: ADMIN_TYPES.SUPER_ADMIN,
  adminCountry: null,
  isSuperAdmin: true,
  isReadOnly: false,
  adminCountry: null,
});

export function useAdminPermissions() {
  return useContext(AdminPermissionContext);
}
