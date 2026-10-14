import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "primary",
  loading = false,
  onConfirm,
  onClose,
  children,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="stack" style={{ gap: "1rem" }}>
        {typeof message === "string" ? (
          <p className="text-main" style={{ margin: 0, lineHeight: 1.5 }}>
            {message}
          </p>
        ) : (
          message
        )}

        {children}

        <div className="button-group" style={{ margin: "0.5rem 0 0" }}>
          <Button
            variant={variant}
            onClick={onConfirm}
            isLoading={loading}
          >
            {confirmLabel}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
