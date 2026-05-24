import { jsonDbClient } from '../db/jsonDbClient';
import { TeamProfile } from '../types/teams';

export class TeamRepository {
  private tableName = 'teams';

  public async getById(id: string): Promise<TeamProfile | null> {
    const teams = await this.list();
    return teams.find((team) => team.id === id) || null;
  }

  public async getByOwner(ownerId: string): Promise<TeamProfile | null> {
    const teams = await this.list();
    return teams.find((team) => team.ownerId === ownerId) || null;
  }

  public async list(): Promise<TeamProfile[]> {
    const teams = await jsonDbClient.readTable<TeamProfile>(this.tableName);
    // Seed with a default team if empty
    if (teams.length === 0) {
      const defaults: TeamProfile[] = [
        {
          id: 'test-team',
          name: 'Test Startup Team',
          plan: 'starter',
          ownerId: 'test-user',
          members: [{ userId: 'test-user', role: 'owner' }],
          dailyBudgetLimitUsd: 10,
          monthlyBudgetLimitUsd: 150,
          creditsBalance: 100,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      await jsonDbClient.writeTable(this.tableName, defaults);
      return defaults;
    }
    return teams;
  }

  public async save(team: TeamProfile): Promise<void> {
    const teams = await this.list();
    const index = teams.findIndex((t) => t.id === team.id);
    if (index >= 0) {
      teams[index] = team;
    } else {
      teams.push(team);
    }
    await jsonDbClient.writeTable(this.tableName, teams);
  }
}

export const teamRepository = new TeamRepository();
