import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: IconDefinition | React.ReactNode;
  count?: number;
}

export interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  ariaLabel?: string;
}

export function Tabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = "",
  ariaLabel,
}: TabsProps<T>) {
  const isIconDefinition = (val: unknown): val is IconDefinition => {
    return Boolean(val && typeof val === "object" && "iconName" in val);
  };

  return (
    <div
      className={`tabs-container ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`tab-btn ${isActive ? "active" : ""}`.trim()}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && (
              <span>
                {isIconDefinition(tab.icon) ? (
                  <FontAwesomeIcon icon={tab.icon} />
                ) : (
                  tab.icon
                )}
              </span>
            )}
            <span>
              {tab.label}
              {typeof tab.count === "number" && ` (${tab.count})`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
