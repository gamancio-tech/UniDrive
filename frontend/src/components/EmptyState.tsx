import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";

export interface EmptyStateProps {
  icon?: IconDefinition | React.ReactNode;
  iconColor?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconColor,
  title,
  description,
  action,
  className = "",
}) => {
  const isIconDefinition = (val: unknown): val is IconDefinition => {
    return Boolean(val && typeof val === "object" && "iconName" in val);
  };

  return (
    <div
      className={`empty-state-container text-center text-muted ${className}`.trim()}
      style={{ padding: "2.5rem 1rem" }}
    >
      {icon && (
        <div
          style={{
            fontSize: "2.2rem",
            marginBottom: "0.5rem",
            color: iconColor || "var(--text-muted)",
          }}
        >
          {isIconDefinition(icon) ? (
            <FontAwesomeIcon icon={icon} />
          ) : (
            icon
          )}
        </div>
      )}
      <h3
        className="text-main"
        style={{
          fontSize: "1.05rem",
          fontWeight: 700,
          margin: "0 0 0.35rem",
        }}
      >
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: "0.85rem", margin: action ? "0 0 1.25rem" : 0 }}>
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
