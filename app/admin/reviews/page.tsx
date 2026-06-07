"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { ApiResponse } from "@/types";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  approved: boolean;
  createdAt: string;
  user: { name: string | null; email: string };
  product: { name: string; slug: string; thumbnail: string };
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  const approvedParam =
    filter === "pending" ? "false" : filter === "approved" ? "true" : undefined;

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (approvedParam) params.set("approved", approvedParam);
      const res = await fetch(`/api/admin/reviews?${params}`);
      const json: ApiResponse<Review[]> = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data ?? [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review deleted");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-ivory-100">Review Moderation</h1>
        <p className="mt-1 font-body text-obsidian-400">Approve or reject customer reviews</p>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "approved"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Reviews ({reviews?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded bg-obsidian-800" />
              ))}
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-obsidian-800 p-4 transition-colors hover:border-obsidian-700"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      {review.product.thumbnail && (
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded border border-obsidian-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={review.product.thumbnail}
                            alt={review.product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-gold-500 text-gold-500"
                                    : "text-obsidian-600"
                                }`}
                              />
                            ))}
                          </div>
                          <Badge variant={review.approved ? "emerald" : "outline"}>
                            {review.approved ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                        {review.title && (
                          <p className="mt-1 font-heading text-ivory-100">{review.title}</p>
                        )}
                        <p className="mt-1 font-body text-sm text-obsidian-400">{review.comment}</p>
                        <p className="mt-2 font-body text-xs text-obsidian-500">
                          {review.user.name ?? review.user.email} · {review.product.name} ·{" "}
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {!review.approved && (
                        <Button
                          size="sm"
                          variant="luxury"
                          className="gap-1"
                          onClick={() => approveMutation.mutate({ id: review.id, approved: true })}
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>
                      )}
                      {review.approved && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() =>
                            approveMutation.mutate({ id: review.id, approved: false })
                          }
                        >
                          <X className="h-4 w-4" />
                          Unapprove
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400"
                        onClick={() => deleteMutation.mutate(review.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center font-body text-obsidian-400">No reviews to moderate</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
