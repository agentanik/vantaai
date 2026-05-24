import { v4 as uuidv4 } from 'uuid';

export const idUtils = {
  generateId(prefix: string = ''): string {
    const uuid = uuidv4().replace(/-/g, '').slice(0, 16);
    return prefix ? `${prefix}_${uuid}` : uuid;
  }
};
