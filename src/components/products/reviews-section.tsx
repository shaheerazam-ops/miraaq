"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: Date;
  user: { name: string | null; image: string | null };
}

interface ReviewsSectionProps {
  productId: string;
  reviews: Review[];
}

export function ReviewsSection({ productId, reviews: initialReviews }: ReviewsSectionProps) {
  const { data: session } = useSession();
  const [reviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please sign in to leave a review");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title, comment }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Review submitted for moderation");
        setTitle("");
        setComment("");
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl tracking-widest text-ivory-50 uppercase mb-8">
        Client Reviews ({reviews.length})
      </h2>

      {reviews.length === 0 ? (
        <p className="text-obsidian-400 mb-8">No reviews yet. Be the first to share your experience.</p>
      ) : (
        <div className="space-y-6 mb-10">
          {reviews.map((review) => (
            <div key={review.id} className="luxury-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-ivory-100">{review.user.name ?? "Anonymous"}</p>
                  <p className="text-xs text-obsidian-500">{formatDate(review.createdAt)}</p>
                </div>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < review.rating ? "fill-gold-400 text-gold-400" : "text-obsidian-600"
                      )}
                    />
                  ))}
                </div>
              </div>
              {review.title && <p className="font-heading text-gold-400 mb-2">{review.title}</p>}
              <p className="text-obsidian-300 text-sm leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}

      {session && (
        <form onSubmit={handleSubmit} className="luxury-card p-6 space-y-4 max-w-lg">
          <h3 className="font-heading text-lg text-gold-400">Write a Review</h3>
          <div>
            <Label>Rating</Label>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  aria-label={`Rate ${i + 1} stars`}
                >
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors",
                      i < rating ? "fill-gold-400 text-gold-400" : "text-obsidian-600 hover:text-gold-400"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="title">Title (optional)</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="comment">Your Review</Label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              minLength={10}
              rows={4}
              className="flex w-full rounded-md border border-obsidian-700 bg-obsidian-900 px-3 py-2 text-sm text-ivory-100 placeholder:text-obsidian-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
            />
          </div>
          <Button type="submit" variant="luxury" disabled={loading}>
            Submit Review
          </Button>
        </form>
      )}
    </div>
  );
}
