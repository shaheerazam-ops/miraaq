"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Shield, User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { ApiResponse } from "@/types";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  emailVerified: string | null;
  createdAt: string;
  _count: { orders: number };
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`);
      const json: ApiResponse<AdminUser[]> = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data ?? [];
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User role updated");
    },
    onError: () => toast.error("Failed to update role"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-ivory-100">Users</h1>
          <p className="mt-1 font-body text-obsidian-400">Manage customer accounts</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-obsidian-500" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Accounts ({users?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="h-64 animate-pulse rounded bg-obsidian-800" />
          ) : (
            <table className="w-full min-w-[800px] font-body text-sm">
              <thead>
                <tr className="border-b border-obsidian-800 text-left text-obsidian-400">
                  <th className="pb-3 pr-4 font-medium">User</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 pr-4 font-medium">Orders</th>
                  <th className="pb-3 pr-4 font-medium">Joined</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-b border-obsidian-800/50">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        {user.role === "ADMIN" ? (
                          <Shield className="h-4 w-4 text-gold-400" />
                        ) : (
                          <User className="h-4 w-4 text-obsidian-500" />
                        )}
                        <span className="font-medium text-ivory-100">{user.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-obsidian-400">{user.email}</td>
                    <td className="py-4 pr-4">
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4 text-ivory-100">{user._count.orders}</td>
                    <td className="py-4 pr-4 text-obsidian-400">{formatDate(user.createdAt)}</td>
                    <td className="py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          roleMutation.mutate({
                            id: user.id,
                            role: user.role === "ADMIN" ? "USER" : "ADMIN",
                          })
                        }
                      >
                        {user.role === "ADMIN" ? "Demote" : "Make Admin"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!isLoading && users?.length === 0 && (
            <p className="py-8 text-center font-body text-obsidian-400">No users found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
