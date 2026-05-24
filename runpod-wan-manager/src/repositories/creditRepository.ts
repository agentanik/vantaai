import { jsonDbClient } from '../db/jsonDbClient';
import { CreditReservation } from '../types/credits';

export class CreditRepository {
  private tableName = 'credit_reservations';

  public async getReservation(id: string): Promise<CreditReservation | null> {
    const list = await this.listReservations();
    return list.find((res) => res.id === id) || null;
  }

  public async getReservationByJobId(jobId: string): Promise<CreditReservation | null> {
    const list = await this.listReservations();
    return list.find((res) => res.jobId === jobId) || null;
  }

  public async listReservations(): Promise<CreditReservation[]> {
    return await jsonDbClient.readTable<CreditReservation>(this.tableName);
  }

  public async saveReservation(reservation: CreditReservation): Promise<void> {
    const list = await this.listReservations();
    const index = list.findIndex((res) => res.id === reservation.id);
    if (index >= 0) {
      list[index] = reservation;
    } else {
      list.push(reservation);
    }
    await jsonDbClient.writeTable(this.tableName, list);
  }

  public async removeReservation(id: string): Promise<void> {
    const list = await this.listReservations();
    const filtered = list.filter((res) => res.id !== id);
    await jsonDbClient.writeTable(this.tableName, filtered);
  }
}

export const creditRepository = new CreditRepository();
