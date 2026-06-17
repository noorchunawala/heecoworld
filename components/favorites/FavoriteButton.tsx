"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FAVORITES_KEY = "heeco_favorite_school_ids";

type FavoriteButtonProps = {
  schoolId: string;
  showText?: boolean;
  className?: string;
};

export default function FavoriteButton({
  schoolId,
  showText = true,
  className,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    const favoriteIds: string[] = stored ? JSON.parse(stored) : [];

    setIsFavorite(favoriteIds.includes(schoolId));
  }, [schoolId]);

  const toggleFavorite = () => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    const favoriteIds: string[] = stored ? JSON.parse(stored) : [];

    const updatedIds = favoriteIds.includes(schoolId)
      ? favoriteIds.filter((id) => id !== schoolId)
      : [...favoriteIds, schoolId];

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedIds));
    setIsFavorite(updatedIds.includes(schoolId));

    window.dispatchEvent(new Event("heeco-favorites-updated"));
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggleFavorite}
      className={cn(
        "rounded-full border-[#D6B46A]/60 text-[#071B33] hover:bg-[#F8F1E7]",
        isFavorite && "bg-[#F8F1E7]",
        className
      )}
    >
      <Heart
        className={cn(
          "mr-2 h-4 w-4",
          isFavorite && "fill-[#D6B46A] text-[#D6B46A]"
        )}
      />
      {showText ? (isFavorite ? "Shortlisted" : "Shortlist") : null}
    </Button>
  );
}