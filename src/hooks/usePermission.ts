// src/hooks/usePermission.ts
import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  hasPermission,
  type ActionId,
  type ModuleId,
} from "../lib/permissions";

function roleFromAuth(profile: { role?: string | null } | null, user: unknown) {
  const metadataRole =
    user &&
    typeof user === "object" &&
    "user_metadata" in user &&
    user.user_metadata &&
    typeof user.user_metadata === "object" &&
    "role" in user.user_metadata
      ? String((user.user_metadata as { role?: string }).role ?? "")
      : "";
  return profile?.role || metadataRole || undefined;
}

export function usePermission() {
  const { profile, user } = useAuth();
  const role = roleFromAuth(profile, user);

  const can = useCallback(
    (module: ModuleId, action: ActionId) =>
      hasPermission({ role }, module, action),
    [role],
  );

  return { can, role };
}