"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Plus, Trash2, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/utils";
import type { ApiResponse } from "@/types";

const couponFormSchema = z.object({
  code: z.string().min(1),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().positive(),
  minPurchase: z.coerce.number().positive().optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  active: z.boolean().optional(),
});

type CouponForm = z.infer<typeof couponFormSchema>;

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minPurchase: number | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const res = await fetch("/api/admin/coupons");
      const json: ApiResponse<Coupon[]> = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data ?? [];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CouponForm>({
    defaultValues: { type: "PERCENTAGE", active: true },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CouponForm) => {
      const parsed = couponFormSchema.parse(data);
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      reset();
      setShowForm(false);
      toast.success("Coupon created");
    },
    onError: () => toast.error("Failed to create coupon"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon deleted");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-ivory-100">Coupons</h1>
          <p className="mt-1 font-body text-obsidian-400">Manage discount codes</p>
        </div>
        <Button variant="luxury" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Coupon</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((data) => createMutation.mutate(data))}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" placeholder="SUMMER20" {...register("code")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="flex h-10 w-full rounded-md border border-obsidian-700 bg-obsidian-900 px-3 text-sm text-ivory-100"
                  {...register("type")}
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input id="value" type="number" step="0.01" {...register("value")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minPurchase">Min Purchase</Label>
                <Input id="minPurchase" type="number" step="0.01" {...register("minPurchase")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses</Label>
                <Input id="maxUses" type="number" {...register("maxUses")} />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" variant="luxury" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Create"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Active Coupons ({coupons?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded bg-obsidian-800" />
          ) : (
            <table className="w-full min-w-[700px] font-body text-sm">
              <thead>
                <tr className="border-b border-obsidian-800 text-left text-obsidian-400">
                  <th className="pb-3 pr-4 font-medium">Code</th>
                  <th className="pb-3 pr-4 font-medium">Discount</th>
                  <th className="pb-3 pr-4 font-medium">Usage</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Expires</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons?.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-obsidian-800/50">
                    <td className="py-4 pr-4 font-mono font-medium text-gold-400">{coupon.code}</td>
                    <td className="py-4 pr-4 text-ivory-100">
                      {coupon.type === "PERCENTAGE"
                        ? `${coupon.value}%`
                        : formatPrice(coupon.value)}
                      {coupon.minPurchase && (
                        <span className="block text-xs text-obsidian-500">
                          Min {formatPrice(coupon.minPurchase)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-obsidian-400">
                      {coupon.usedCount}
                      {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                    </td>
                    <td className="py-4 pr-4">
                      <Badge variant={coupon.active ? "emerald" : "secondary"}>
                        {coupon.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4 text-obsidian-400">
                      {coupon.expiresAt ? formatDate(coupon.expiresAt) : "Never"}
                    </td>
                    <td className="py-4">
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toggleMutation.mutate({ id: coupon.id, active: !coupon.active })
                          }
                        >
                          {coupon.active ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400"
                          onClick={() => deleteMutation.mutate(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
