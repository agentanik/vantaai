import { env, validateEnvConfig } from '../config/env';

export const config = env;

export const validateConfig = () => {
  validateEnvConfig();
};
