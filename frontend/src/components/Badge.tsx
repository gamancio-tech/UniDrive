import React from "react";

export interface BadgeProps {
  variant?: "success" | "danger" | "info" | "neutral" | "warning";
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "neutral",
  children,
  style,
  className = "",
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} style={style}>
      {children}
    </span>
  );
};
