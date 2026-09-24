import { tripCancellationRepository } from "../repositories/tripCancellation.repository";

function toDateOnly(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10));
}

export const tripCancellationService = {
  /** RF06: motorista cancela o dia inteiro (feriado, van quebrada etc.). */
  async cancelDay(driverId: string, date: Date, reason?: string) {
    return tripCancellationRepository.create(driverId, toDateOnly(date), reason);
  },

  /** RF06: motorista desfaz o cancelamento do dia inteiro. */
  async uncancelDay(driverId: string, date: Date) {
    return tripCancellationRepository.delete(driverId, toDateOnly(date));
  },
};
