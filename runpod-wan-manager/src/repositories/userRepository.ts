import { jsonDbClient } from '../db/jsonDbClient';
import { UserProfile } from '../types/users';

export class UserRepository {
  private tableName = 'users';

  public async getById(id: string): Promise<UserProfile | null> {
    const users = await this.list();
    return users.find((user) => user.id === id) || null;
  }

  public async getByEmail(email: string): Promise<UserProfile | null> {
    const users = await this.list();
    return users.find((user) => user.email === email) || null;
  }

  public async list(): Promise<UserProfile[]> {
    const users = await jsonDbClient.readTable<UserProfile>(this.tableName);
    // If empty seed with default users
    if (users.length === 0) {
      const defaults: UserProfile[] = [
        {
          id: 'test-user',
          email: 'test@example.com',
          creditsBalance: 100,
          role: 'user',
          dailyBudgetLimitUsd: 10,
          monthlyBudgetLimitUsd: 150,
          status: 'active'
        },
        {
          id: 'admin-user',
          email: 'admin@example.com',
          creditsBalance: 500,
          role: 'admin',
          dailyBudgetLimitUsd: 50,
          monthlyBudgetLimitUsd: 500,
          status: 'active'
        }
      ];
      await jsonDbClient.writeTable(this.tableName, defaults);
      return defaults;
    }
    return users;
  }

  public async save(user: UserProfile): Promise<void> {
    const users = await this.list();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    await jsonDbClient.writeTable(this.tableName, users);
  }
}

export const userRepository = new UserRepository();
