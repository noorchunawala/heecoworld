"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

import {
  addFavoriteSchool,
  removeFavoriteSchool,
  getFavoriteSchoolIds,
} from "@/lib/favorites";

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
  const { status ,user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

useEffect(() => {
  async function loadFavorite() {
    if (status !== "authenticated" || !user) {
      setIsFavorite(false);
      return;
    }

    const ids = await getFavoriteSchoolIds(user.id);
    setIsFavorite(ids.includes(schoolId));
  }

  loadFavorite();
}, [status, user, schoolId]);

  if (status !== "authenticated") {
    return (
      <Button
        asChild
        type="button"
        variant="outline"
        className={cn(
          "rounded-full border-[#D6B46A]/60 text-[#071B33] hover:bg-[#F8F1E7]",
          className
        )}
      >
        <Link href="/login">
          <Heart className="mr-2 h-4 w-4" />
          {showText ? "Login to shortlist" : null}
        </Link>
      </Button>
    );
  }

 const toggleFavorite = async () => {
  if (!user) return;

  if (isFavorite) {
    await removeFavoriteSchool(user.id, schoolId);
    setIsFavorite(false);
  } else {
    await addFavoriteSchool(user.id, schoolId);
    setIsFavorite(true);
  }

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