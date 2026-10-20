import { fetch as expoFetch } from 'expo/fetch';

import type { AgentJApi } from './AgentJApi';
import { HttpApi, type FetchLike } from './http/HttpApi';
import { MockApi } from './mock/MockApi';

export type { AgentJApi } from './AgentJApi';
export * from './types';

export interface ApiEnv {
  EXPO_PUBLIC_USE_MOCKS?: string;
  EXPO_PUBLIC_API_URL?: string;
  EXPO_PUBLIC_API_TOKEN?: string;
}

export type ApiMode = 'mock' | 'http';

/** Mocks unless EXPO_PUBLIC_USE_MOCKS is "false" and a backend URL is set. */
export function apiModeFor(env: ApiEnv): ApiMode {
  return env.EXPO_PUBLIC_USE_MOCKS === 'false' && env.EXPO_PUBLIC_API_URL ? 'http' : 'mock';
}

export function createApi(
  env: ApiEnv,
  fetchImpl: FetchLike = expoFetch as unknown as FetchLike,
): AgentJApi {
  const mock = new MockApi();
  if (apiModeFor(env) === 'mock') return mock;
  return new HttpApi({
    baseUrl: env.EXPO_PUBLIC_API_URL ?? '',
    token: env.EXPO_PUBLIC_API_TOKEN || undefined,
    fetch: fetchImpl,
    fallback: mock,
  });
}

// EXPO_PUBLIC_* must be read with static property access, otherwise they are not inlined.
export const api: AgentJApi = createApi({
  EXPO_PUBLIC_USE_MOCKS: process.env.EXPO_PUBLIC_USE_MOCKS,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_API_TOKEN: process.env.EXPO_PUBLIC_API_TOKEN,
});
