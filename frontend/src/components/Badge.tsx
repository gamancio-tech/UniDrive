import React from "react";

export interface BadgeProps {
  variant?: "success" | "danger" | "info" | "neutral";
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "neutral", children }) => {
  return <span className={`badge badge-${variant}`}>{children}</span>;
};
