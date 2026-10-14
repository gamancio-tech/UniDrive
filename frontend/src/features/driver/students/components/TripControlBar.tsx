import React from "react";
import { Button } from "../../../../components/Button";
import { FilterPills } from "../../../../components/FilterPills";
import { TripStep } from "../../../dailyStatus/useDailyStatus";
import { TripType } from "../../../../utils/trip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSun,
  faMoon,
  faRocket,
  faFlagCheckered,
} from "@fortawesome/free-solid-svg-icons";

export interface TripControlBarProps {
  tripType: TripType;
  tripStep?: TripStep;
  finishingTrip: boolean;
  onSelectTrip: (trip: TripType) => void;
  onDeclareDeparture: () => void;
  onFinishTripModalOpen: () => void;
}

export const TripControlBar: React.FC<TripControlBarProps> = ({
  tripType,
  tripStep,
  finishingTrip,
  onSelectTrip,
  onDeclareDeparture,
  onFinishTripModalOpen,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        background: "var(--bg-input)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "0.6rem 0.85rem",
        marginBottom: "1rem",
      }}
    >
      <div className="row-wrap" style={{ gap: "0.45rem" }}>
        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>
          Trajeto:
        </span>
        <FilterPills
          options={[
            { value: "ida", label: "Ida", icon: faSun },
            { value: "volta", label: "Volta", icon: faMoon },
          ]}
          value={tripType}
          onChange={onSelectTrip}
          style={{ marginBottom: 0 }}
        />
      </div>

      <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", flexWrap: "wrap" }}>
        {tripType === "volta" && tripStep === "aguardando" && (
          <Button
            variant="primary"
            onClick={onDeclareDeparture}
            disabled={finishingTrip}
            style={{
              width: "auto",
              minHeight: "34px",
              padding: "0.35rem 0.85rem",
              fontSize: "0.82rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <FontAwesomeIcon icon={faRocket} />
            <span>Declarar Partida (Volta)</span>
          </Button>
        )}

        <Button
          variant={tripType === "volta" && tripStep === "aguardando" ? "ghost" : "primary"}
          onClick={onFinishTripModalOpen}
          disabled={finishingTrip}
          style={{
            width: "auto",
            minHeight: "34px",
            padding: "0.35rem 0.85rem",
            fontSize: "0.82rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <FontAwesomeIcon icon={faFlagCheckered} />
          <span>Finalizar {tripType === "ida" ? "Ida" : "Volta"}</span>
        </Button>
      </div>
    </div>
  );
};
