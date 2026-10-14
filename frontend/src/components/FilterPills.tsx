import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";

export interface FilterPillOption<T extends string> {
  value: T;
  label: string;
  icon?: IconDefinition | React.ReactNode;
  count?: number;
  variant?: "default" | "success" | "danger";
}

export interface FilterPillsProps<T extends string> {
  options: FilterPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  className = "",
  style,
}: FilterPillsProps<T>) {
  const isIconDefinition = (val: unknown): val is IconDefinition => {
    return Boolean(val && typeof val === "object" && "iconName" in val);
  };

  return (
    <div className={`filter-pills ${className}`.trim()} style={style}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        const variantClass = !isSelected
          ? ""
          : opt.variant === "success"
          ? "active-success"
          : opt.variant === "danger"
          ? "active-danger"
          : "active";

        return (
          <button
            key={opt.value}
            type="button"
            className={`filter-pill ${variantClass}`.trim()}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon && (
              <span className="icon-gap-sm">
                {isIconDefinition(opt.icon) ? (
                  <FontAwesomeIcon icon={opt.icon} />
                ) : (
                  opt.icon
                )}
              </span>
            )}
            <span>
              {opt.label}
              {typeof opt.count === "number" && ` (${opt.count})`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
