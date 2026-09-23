import { useDailyStatus } from "../features/dailyStatus/useDailyStatus";
import { DailyStatusCard } from "../features/dailyStatus/DailyStatusCard";
import { authStorage } from "../api/client";

export function StudentHome() {
  const { missingCount, cancelled, loading, isBoarded, setStatus, checkIn, cancelBoardedSelf } = useDailyStatus();

  return (
    <main>
      <h1>UniDrive</h1>
      <DailyStatusCard
        missingCount={missingCount}
        cancelled={cancelled}
        loading={loading}
        isBoarded={isBoarded}
        onSetStatus={setStatus}
        onCheckIn={checkIn}
        onCancelBoardedSelf={cancelBoardedSelf}
      />
      <button onClick={() => { authStorage.clear(); window.location.reload(); }}>Logout</button>
    </main>
  );
}
