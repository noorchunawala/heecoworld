"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppFloat() {
  const whatsappNumber = "9710585377860";

  const message =
    "Hi HeecoWorld, I would like to know more about educational industry visits.";

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        message
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-green-500 flex items-center justify-center shadow-xl hover:scale-110 transition z-50"
    >
      <MessageCircle size={28} color="white" />
    </a>
  );
}