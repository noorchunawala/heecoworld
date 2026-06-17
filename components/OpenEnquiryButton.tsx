"use client";

import { ReactNode } from "react";

type OpenEnquiryButtonProps = {
  children: ReactNode;
  className?: string;
};

export default function OpenEnquiryButton({
  children,
  className,
}: OpenEnquiryButtonProps) {
  const openEnquiry = () => {
    document.dispatchEvent(new Event("open-enquiry"));
  };

  return (
    <button type="button" onClick={openEnquiry} className={className}>
      {children}
    </button>
  );
}