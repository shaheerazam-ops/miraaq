"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Loader2, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { categorySchema } from "@/lib/validators/auth";
import type { ApiResponse } from "@/types";

type CategoryInput = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  featured: boolean;
  sortOrder: number;
  _count: { products: number };
  parent?: { name: string } | null;
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      const json: ApiResponse<Category[]> = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data ?? [];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { featured: false, sortOrder: 0 },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CategoryInput) => {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      reset();
      setShowForm(false);
      toast.success("Category created");
    },
    onError: () => toast.error("Failed to create category"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category deleted");
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to delete"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-ivory-100">Categories</h1>
          <p className="mt-1 font-body text-obsidian-400">Organize your product catalog</p>
        </div>
        <Button variant="luxury" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((data) => createMutation.mutate(data))}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input id="sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...register("description")} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input type="checkbox" id="featured" {...register("featured")} />
                <Label htmlFor="featured">Featured category</Label>
              </div>
              <div className="flex gap-2 sm:col-span-2">
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
            <FolderTree className="h-5 w-5" />
            Categories ({categories?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded bg-obsidian-800" />
          ) : (
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="border-b border-obsidian-800 text-left text-obsidian-400">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Slug</th>
                  <th className="pb-3 pr-4 font-medium">Products</th>
                  <th className="pb-3 pr-4 font-medium">Featured</th>
                  <th className="pb-3 pr-4 font-medium">Order</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories?.map((cat) => (
                  <tr key={cat.id} className="border-b border-obsidian-800/50">
                    <td className="py-4 pr-4 font-medium text-ivory-100">{cat.name}</td>
                    <td className="py-4 pr-4 text-obsidian-400">{cat.slug}</td>
                    <td className="py-4 pr-4 text-ivory-100">{cat._count.products}</td>
                    <td className="py-4 pr-4">
                      {cat.featured ? (
                        <Badge variant="default">Featured</Badge>
                      ) : (
                        <span className="text-obsidian-500">—</span>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-obsidian-400">{cat.sortOrder}</td>
                    <td className="py-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400"
                        onClick={() => deleteMutation.mutate(cat.id)}
                        disabled={cat._count.products > 0}
                        title={cat._count.products > 0 ? "Remove products first" : "Delete"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
