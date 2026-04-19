import { useEffect, useMemo, useState } from "react";
import { api } from "../api/axiosInstance";
import axios from "axios";
import type { AdminUser } from "../types/interfaces";

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const isBusy = loadingList || loadingUser || saving;

  const userAvatarFallback = "https://placehold.co/32x32";

  const selectedId = selectedUser?.id ?? null;

  const loadUsers = async () => {
    try {
      setError("");
      setLoadingList(true);
      const res = await api.get<AdminUser[]>("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoadingList(false);
    }
  };

  const loadUserById = async (id: number) => {
    try {
      setError("");
      setLoadingUser(true);

      const res = await api.get<AdminUser>(`/admin/users/${id}`);
      const u = res.data;

      setSelectedUser(u);
      setUsername(u.username);
      setEmail(u.email);
      setRole((u.role as "user" | "admin") || "user");
      setDescription(u.description || "");
      setAbout(u.about || "");
      setAvatarUrl(u.avatar_url || "");
    } catch (err) {
      console.error(err);
      setError("Failed to load user details. Please try again.");
    } finally {
      setLoadingUser(false);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setUsername("");
    setEmail("");
    setRole("user");
    setDescription("");
    setAbout("");
    setAvatarUrl("");
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      setError("");
      setSaving(true);

      await api.put(`/admin/users/${selectedUser.id}`, {
        username: username.trim() || null,
        email: email.trim() || null,
        role,
        avatar_url: avatarUrl.trim() || null,
        description: description.trim() || null,
        about: about.trim() || null,
      });

      await loadUsers();
      await loadUserById(selectedUser.id);
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;
        setError(apiError || "Failed to update user. Please try again.");
      } else {
        setError("Failed to update user. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    const ok = window.confirm(`Delete user "${selectedUser.username}"? This action cannot be undone.`);
    if (!ok) return;

    try {
      setError("");
      setSaving(true);

      await api.delete(`/admin/users/${selectedUser.id}`);

      resetForm();
      await loadUsers();
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        const apiError = (err.response?.data as { error?: string } | undefined)?.error;
        setError(apiError || "Failed to delete user. Please try again.");
      } else {
        setError("Failed to delete user. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const selectedMeta = useMemo(() => {
    if (!selectedUser) return null;
    return {
      created: new Date(selectedUser.created_at).toLocaleString(),
      avatar: selectedUser.avatar_url || userAvatarFallback,
    };
  }, [selectedUser]);

  return (
    <main className="p-4 sm:p-6 text-text">
      <div className="max-w-7xl mx-auto">
        <section className="mb-6 flex flex-col gap-2 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin panel</h1>
            <p className="text-text-secondary">Manage users: view, edit, and delete accounts.</p>
          </div>

          {error && (
            <div className="rounded-lg bg-error/10 border border-error/30 px-3 py-2">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 rounded-2xl bg-surface shadow-3xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Users</h2>
              {loadingList && <span className="text-xs text-text-secondary">Loading...</span>}
            </div>

            <div className="lg:hidden -mx-2 px-2">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {users.map((u) => {
                  const active = selectedId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => loadUserById(u.id)}
                      className={[
                        "shrink-0 w-64 rounded-xl p-3 text-left transition-colors duration-200",
                        active ? "bg-surface-focus" : "bg-surface-lite hover:bg-surface-lite-focus",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar_url || userAvatarFallback}
                          alt={u.username}
                          className="w-10 h-10 rounded-full border object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.username}</p>
                          <p className="text-xs text-text-secondary truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-text-secondary">Role</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-surface text-text">
                          {u.role}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <ul className="hidden lg:block space-y-2 max-h-[70vh] overflow-y-auto">
              {users.map((u) => {
                const active = selectedId === u.id;
                return (
                  <li
                    key={u.id}
                    className={[
                      "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200",
                      active ? "bg-surface-focus" : "bg-surface-lite hover:bg-surface-lite-focus",
                    ].join(" ")}
                    onClick={() => loadUserById(u.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={u.avatar_url || userAvatarFallback}
                        alt={u.username}
                        className="w-8 h-8 rounded-full border object-cover"
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{u.username}</p>
                        <p className="text-xs text-text-secondary truncate">{u.email}</p>
                      </div>
                    </div>

                    <span className="text-xs px-2 py-1 rounded-full bg-surface text-text shrink-0">
                      {u.role}
                    </span>
                  </li>
                );
              })}
            </ul>

            {!loadingList && users.length === 0 && (
              <p className="text-text-secondary text-sm">No users found.</p>
            )}
          </section>

          <section className="lg:col-span-2 rounded-2xl bg-surface glow-hover shadow-3xl p-4 sm:p-6">
            {selectedUser ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">Edit user</h2>
                    <p className="text-text-secondary text-sm">
                      User #{selectedUser.id} • Created at: {selectedMeta?.created}
                    </p>
                  </div>

                  <img
                    src={selectedMeta?.avatar || userAvatarFallback}
                    alt="avatar"
                    className="w-12 h-12 rounded-full border object-cover"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm text-text-secondary">Username</label>
                    <input
                      className="w-full rounded-lg px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isBusy}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm text-text-secondary">Email</label>
                    <input
                      className="w-full rounded-lg px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isBusy}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm text-text-secondary">Role</label>
                    <select
                      className="w-full rounded-lg px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200"
                      value={role}
                      onChange={(e) => setRole(e.target.value as "user" | "admin")}
                      disabled={isBusy}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-sm text-text-secondary">Avatar URL</label>
                    <input
                      className="w-full rounded-lg px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      disabled={isBusy}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block mb-1 text-sm text-text-secondary">Description</label>
                  <textarea
                    className="w-full rounded-xl px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200 resize-none min-h-28"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isBusy}
                  />
                </div>

                <div className="mt-4">
                  <label className="block mb-1 text-sm text-text-secondary">About</label>
                  <textarea
                    className="w-full rounded-xl px-4 py-3 bg-surface-lite focus:bg-surface-lite-focus focus:outline-none transition-colors duration-200 resize-none min-h-28"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    disabled={isBusy}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-end mt-5">
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={isBusy}
                    className="px-4 py-3 rounded-lg bg-secondary hover:bg-secondary-hover text-text-buttons transition-all duration-200
                               disabled:opacity-70 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isBusy}
                    className="px-4 py-3 rounded-lg bg-primary hover:bg-primary-hover text-text-buttons transition-all duration-200
                               disabled:opacity-70 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl bg-surface-lite p-5">
                <p className="text-text-secondary">
                  Select a user from the list to view and edit details.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default AdminPage;
