import React from "react";
import { PaymentCycle } from "../../../../api/payments";
import { Badge } from "../../../../components/Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faHourglassHalf } from "@fortawesome/free-solid-svg-icons";

export interface PaymentBadgeProps {
  payment?: PaymentCycle;
  isMarkingPaid?: boolean;
  isRejectingPayment?: boolean;
  onConfirm: () => void;
  onReject?: () => void;
}

export const PaymentBadge: React.FC<PaymentBadgeProps> = ({
  payment,
  isMarkingPaid = false,
  isRejectingPayment = false,
  onConfirm,
  onReject,
}) => {
  if (!payment) return null;

  const isPaid = Boolean(payment.paidAt);
  const isAwaitingConfirmation = !isPaid && Boolean(payment.paymentRequestedAt);

  if (isPaid) {
    return (
      <Badge variant="success" style={{ fontSize: "0.68rem" }}>
        Pago
      </Badge>
    );
  }

  if (isAwaitingConfirmation) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
        <Badge variant="warning" style={{ fontSize: "0.68rem" }}>
          <FontAwesomeIcon icon={faHourglassHalf} style={{ marginRight: "0.25rem" }} />
          Confirmar Pgto
        </Badge>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isMarkingPaid || isRejectingPayment}
          style={{
            background: "var(--success, #22c55e)",
            border: "none",
            color: "#fff",
            fontSize: "0.72rem",
            fontWeight: 700,
            cursor: "pointer",
            padding: "0.18rem 0.45rem",
            borderRadius: "4px",
            minHeight: "auto",
            width: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          {isMarkingPaid ? "..." : (
            <>
              <FontAwesomeIcon icon={faCheck} />
              <span>Confirmar</span>
            </>
          )}
        </button>
        {onReject && (
          <button
            type="button"
            onClick={onReject}
            disabled={isMarkingPaid || isRejectingPayment}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--danger, #ef4444)",
              fontSize: "0.72rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              minHeight: "auto",
              width: "auto",
              textDecoration: "underline",
            }}
            title="Recusar confirmação"
          >
            {isRejectingPayment ? "..." : "Recusar"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
      <Badge variant="danger" style={{ fontSize: "0.68rem" }}>
        Pendente
      </Badge>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isMarkingPaid}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--primary)",
          fontSize: "0.75rem",
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
          minHeight: "auto",
          width: "auto",
          textDecoration: "underline",
        }}
      >
        {isMarkingPaid ? "..." : "Dar Baixa"}
      </button>
    </div>
  );
};
