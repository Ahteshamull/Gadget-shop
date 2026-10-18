import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  RefreshCw,
  Trash2,
  UserCog,
  X,
  UserPlus,
  Shield,
  Users,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteManagedUser,
  fetchManagedUsers,
  updateManagedUserRole,
  updateManagedUserStatus,
  type AccessRole,
  type ManagedUser,
} from "../store/userManagementSlice";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchBusinessProfile } from "../store/businessProfileSlice";
import { fetchPartnerTransactions, fetchShopExpenses } from "../store/partnerSlice";
import { CreateUserModal } from "@/components/partner/CreateUserModal";
import { StatCard, StatCardSkeleton } from "@/components/ui/StatCard";
import { AppPagination } from "@/components/ui/pagination";

export const Route = createFileRoute("/user-management")({
  head: () => ({ meta: [{ title: "User Management - PhoneTrack" }] }),
  component: UserManagement,
});

function formatDate(value: string): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function UserManagement() {
  const dispatch = useAppDispatch();
  const { users, usersLoading, deleteLoadingId, error } = useAppSelector(
    (state) => state.userManagement,
  );
  const [pendingDeleteUser, setPendingDeleteUser] = useState<ManagedUser | null>(null);

  const currentUser = useAppSelector((state) => state.auth.user);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchManagedUsers());
  }, [dispatch]);

  const userCounts = useMemo(() => {
    const adminOwners = users.filter(
      (user) => user.role === "admin" || user.role === "owner" || user.role === "partner",
    ).length;
    const staff = users.filter((user) => user.role === "staff").length;
    const active = users.filter((user) => user.accessStatus === "active").length;

    return {
      total: users.length,
      adminOwners,
      staff,
      active,
    };
  }, [users]);

  const [page, setPage] = useState(1);
  const USERS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(users.length / USERS_PER_PAGE));
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * USERS_PER_PAGE;
    return users.slice(start, start + USERS_PER_PAGE);
  }, [users, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [totalPages, page]);

  const removeUserAccount = (user: ManagedUser) => {
    setPendingDeleteUser(user);
  };

  const confirmRemoveUserAccount = () => {
    if (!pendingDeleteUser) return;
    dispatch(deleteManagedUser(pendingDeleteUser.id))
      .unwrap()
      .then(() => {
        dispatch(fetchManagedUsers());
        dispatch(fetchBusinessProfile());
        dispatch(fetchPartnerTransactions());
        dispatch(fetchShopExpenses());
      })
      .catch(() => undefined);
    setPendingDeleteUser(null);
  };

  const handleRoleChange = (userId: string, newRole: AccessRole) => {
    dispatch(updateManagedUserRole({ id: userId, role: newRole }));
  };

  const handleStatusToggle = (userId: string, currentStatus: "active" | "disabled") => {
    const nextStatus = currentStatus === "active" ? "disabled" : "active";
    dispatch(updateManagedUserStatus({ id: userId, accessStatus: nextStatus }));
  };

  const refreshUsers = () => {
    dispatch(fetchManagedUsers());
  };

  const isOwner = currentUser?.role === "owner" || currentUser?.role === "admin";
  const isAdminOrOwner = isOwner;

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 max-w-[1800px] mx-auto pb-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            <UserCog className="size-3.5" />
            {isOwner ? "Owner / Admin Master Control" : "Staff Access"}
          </div>
          <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">
            User & Team Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, assign roles, and manage system access for Owners, Admins, and Staff.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdminOrOwner && (
            <Button
              type="button"
              onClick={() => setCreateUserModalOpen(true)}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="size-4" />
              Create User
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={refreshUsers}
            disabled={usersLoading}
          >
            <RefreshCw className={`size-4 ${usersLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        {usersLoading && users.length === 0 ? (
          <>
            <StatCardSkeleton variant="indigo" />
            <StatCardSkeleton variant="emerald" />
            <StatCardSkeleton variant="teal" />
            <StatCardSkeleton variant="rose" />
          </>
        ) : (
          <>
            <StatCard
              label="Total Users"
              value={userCounts.total}
              sub="All system accounts"
              todaySub="Registered members"
              icon={Users}
              variant="indigo"
            />
            <StatCard
              label="Admins / Owners"
              value={userCounts.adminOwners}
              sub="Full control access"
              todaySub="Owner & Admin roles"
              icon={Shield}
              variant="emerald"
            />
            <StatCard
              label="Staff Accounts"
              value={userCounts.staff}
              sub="Counter & sales access"
              todaySub="Staff role permissions"
              icon={UserCheck}
              variant="teal"
            />
            <StatCard
              label="Active Accounts"
              value={userCounts.active}
              sub="Live enabled accounts"
              todaySub={`${userCounts.total - userCounts.active} disabled accounts`}
              icon={CheckCircle2}
              variant="rose"
            />
          </>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-foreground">Active User Accounts</h2>
            <p className="text-xs text-muted-foreground">
              {userCounts.adminOwners} Admin / Owner, {userCounts.staff} Staff
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={refreshUsers}
            disabled={usersLoading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`size-4 ${usersLoading ? "animate-spin" : ""}`} />
            Refresh Users
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-bold">User</th>
                <th className="px-4 py-3 text-left font-bold">Role & Permission</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
                <th className="px-4 py-3 text-left font-bold">Created</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Loading user accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No user accounts found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const deleting = deleteLoadingId === user.id;
                  const isSelf = Boolean(
                    (currentUser?.id && user.id === currentUser.id) ||
                    (currentUser?.email && user.email.toLowerCase() === currentUser.email.toLowerCase())
                  );
                  const canChangeRole = isOwner && !isSelf;
                  const canDelete = !isSelf && isOwner;

                  return (
                    <tr key={user.id} className="border-t hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{user.name}</span>
                          {isSelf && (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="size-3.5" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {canChangeRole ? (
                          <select
                            value={user.role === "owner" || user.role === "partner" ? "admin" : user.role}
                            onChange={(e) =>
                              handleRoleChange(user.id, e.target.value as AccessRole)
                            }
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin / Owner</option>
                          </select>
                        ) : (
                          <Badge
                            className={
                              user.role === "staff"
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary/12 text-primary border-primary/20"
                            }
                          >
                            {user.role === "staff" ? "STAFF" : "ADMIN / OWNER"}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => !isSelf && handleStatusToggle(user.id, user.accessStatus)}
                          disabled={isSelf}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                            user.accessStatus === "active"
                              ? "bg-emerald-500/12 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20"
                              : "bg-red-500/12 text-red-700 border-red-200 hover:bg-red-500/20"
                          } ${isSelf ? "cursor-default opacity-80" : "cursor-pointer"}`}
                          title={
                            isSelf
                              ? "You cannot disable your own account"
                              : "Click to toggle status"
                          }
                        >
                          <span
                            className={`size-1.5 rounded-full ${user.accessStatus === "active" ? "bg-emerald-600" : "bg-red-600"}`}
                          />
                          {user.accessStatus === "active" ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground text-xs">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeUserAccount(user)}
                            disabled={!canDelete || deleting}
                            title={
                              isSelf
                                ? "You cannot delete your own account"
                                : canDelete
                                  ? "Delete account and all related data"
                                  : "Permission denied"
                            }
                          >
                            <Trash2 className="size-4" />
                            {deleting ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="border-t px-4 py-3 bg-muted/10">
            <AppPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {pendingDeleteUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
        >
          <div
            className="w-full max-w-md rounded-xl border bg-card p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Delete {pendingDeleteUser.name} ({pendingDeleteUser.role})?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    Are you sure? Account <strong>{pendingDeleteUser.email}</strong> and all associated partner investments, capital withdrawals, and history will be completely and permanently removed.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingDeleteUser(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setPendingDeleteUser(null)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={confirmRemoveUserAccount}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create User / Partner Modal */}
      <CreateUserModal open={createUserModalOpen} onClose={() => setCreateUserModalOpen(false)} />
    </div>
  );
}

