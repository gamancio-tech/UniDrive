import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  ...props
}) => {
  return (
    <button
      className={`${variant} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
          <span>Carregando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
