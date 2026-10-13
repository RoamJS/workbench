export type FeatureProvider = {
  feature: string;
  id: string;
  priority: number;
  start: (context: { signal: AbortSignal }) => void | Promise<void>;
  stop: () => void | Promise<void>;
  onError?: (event: FeatureOwnershipError) => void;
};

export type FeatureOwnershipError = {
  feature: string;
  providerId: string;
  phase: "start" | "stop";
  error: unknown;
};

export type FeatureRegistration = {
  ready: Promise<void>;
  release: () => Promise<void>;
};

type Outcome = { ok: true } | { ok: false; error: unknown };
type Provider = FeatureProvider & {
  token: symbol;
  failure?: { error: unknown };
};
type Activation = {
  provider: Provider;
  controller: AbortController;
  started: boolean;
  settled: boolean;
  stopping: boolean;
  interruptedStartup: boolean;
  startResult: Promise<Outcome>;
  stopResult?: Promise<Outcome>;
};
type Waiter = {
  provider?: Provider;
  resolve: () => void;
  reject: (error: unknown) => void;
};
type FeatureState = {
  providers: Map<string, Provider>;
  waiters: Waiter[];
  active?: Activation;
  running: boolean;
  revision: number;
  blocked?: { error: unknown };
};
type Registry = {
  version: 1;
  register: (provider: FeatureProvider) => FeatureRegistration;
};

const REGISTRY_KEY = Symbol.for("roamjs.feature-ownership.v1");
export const FEATURE_PRIORITY = { bundled: 10, standalone: 100 } as const;

const invoke = (callback: () => void | Promise<void>): Promise<Outcome> => {
  try {
    return Promise.resolve(callback()).then(
      () => ({ ok: true }),
      (error: unknown) => ({ ok: false, error }),
    );
  } catch (error) {
    return Promise.resolve({ ok: false, error });
  }
};

const report = ({
  provider,
  phase,
  error,
}: {
  provider: Provider;
  phase: FeatureOwnershipError["phase"];
  error: unknown;
}): void => {
  const event = {
    feature: provider.feature,
    providerId: provider.id,
    phase,
    error,
  };
  try {
    if (provider.onError) provider.onError(event);
    else console.error("RoamJS feature ownership failed", event);
  } catch (reportingError) {
    console.error(
      "RoamJS feature ownership error reporter failed",
      reportingError,
    );
  }
};

const winner = (state: FeatureState): Provider | undefined =>
  [...state.providers.values()]
    .filter((provider) => !provider.failure)
    .sort((a, b) =>
      a.priority !== b.priority
        ? b.priority - a.priority
        : a.id < b.id
          ? -1
          : a.id > b.id
            ? 1
            : 0,
    )[0];

// Stop runs immediately to invalidate a provider's pending asynchronous startup.
const interrupt = (active: Activation): void => {
  if (active.stopping) return;
  active.stopping = true;
  active.interruptedStartup = !active.settled;
  active.controller.abort();
  if (active.started) active.stopResult = invoke(active.provider.stop);
};

const finishStop = async (state: FeatureState): Promise<boolean> => {
  const active = state.active;
  if (!active) return true;
  interrupt(active);
  await active.startResult;
  const firstStop = await active.stopResult;
  // A provider may complete work after cancellation. Clean up again after settling.
  const finalStop =
    active.started && active.interruptedStartup
      ? await invoke(active.provider.stop)
      : firstStop;
  const failed = [firstStop, finalStop].find((result) => result && !result.ok);
  if (failed && !failed.ok) {
    state.blocked = { error: failed.error };
    report({ provider: active.provider, phase: "stop", error: failed.error });
    return false;
  }
  state.active = undefined;
  return true;
};

const reconcile = async (state: FeatureState): Promise<void> => {
  while (!state.blocked) {
    const next = winner(state);
    if (state.active) {
      if (state.active.provider === next && !state.active.stopping) return;
      if (!(await finishStop(state))) return;
      continue;
    }
    if (!next) return;
    const active: Activation = {
      provider: next,
      controller: new AbortController(),
      started: false,
      settled: false,
      stopping: false,
      interruptedStartup: false,
      startResult: Promise.resolve({ ok: true }),
    };
    state.active = active;
    active.startResult = Promise.resolve().then(async (): Promise<Outcome> => {
      if (active.stopping) return { ok: true };
      active.started = true;
      return invoke(() => next.start({ signal: active.controller.signal }));
    });
    const result = await active.startResult;
    active.settled = true;
    if (!result.ok && !active.stopping) {
      next.failure = { error: result.error };
      report({ provider: next, phase: "start", error: result.error });
    }
    if (next.failure || next !== winner(state) || active.stopping) {
      if (!(await finishStop(state))) return;
      continue;
    }
    return;
  }
};

const requestReconcile = (state: FeatureState): void => {
  if (state.active && state.active.provider !== winner(state)) {
    interrupt(state.active);
  }
  state.revision += 1;
  if (state.running) return;
  state.running = true;
  void Promise.resolve().then(async () => {
    try {
      let revision: number;
      do {
        revision = state.revision;
        await reconcile(state);
      } while (revision !== state.revision);
    } catch (error) {
      state.blocked = { error };
      console.error("RoamJS feature ownership registry failed", error);
    }
    state.running = false;
    const waiters = state.waiters.splice(0);
    waiters.forEach(({ provider, resolve, reject }) => {
      const failure = state.blocked || provider?.failure;
      if (failure) reject(failure.error);
      else resolve();
    });
  });
};

const waitForReconcile = ({
  state,
  provider,
}: {
  state: FeatureState;
  provider?: Provider;
}): Promise<void> =>
  new Promise((resolve, reject) => {
    state.waiters.push({ provider, resolve, reject });
    requestReconcile(state);
  });

const createRegistry = (): Registry => {
  const features = new Map<string, FeatureState>();
  return {
    version: 1,
    register: (options): FeatureRegistration => {
      if (
        !options.feature.trim() ||
        !options.id.trim() ||
        !Number.isFinite(options.priority)
      ) {
        throw new Error(
          "A feature provider needs a feature, stable id and finite priority",
        );
      }
      const state: FeatureState = features.get(options.feature) || {
        providers: new Map(),
        waiters: [],
        running: false,
        revision: 0,
      };
      features.set(options.feature, state);
      const provider = { ...options, token: Symbol(options.id) };
      state.providers.set(provider.id, provider);
      const ready = waitForReconcile({ state, provider });
      let released: Promise<void> | undefined;
      return {
        ready,
        release: (): Promise<void> => {
          if (released) return released;
          if (state.providers.get(provider.id)?.token === provider.token) {
            state.providers.delete(provider.id);
          }
          released = waitForReconcile({ state });
          return released;
        },
      };
    },
  };
};

/** Copies bundled by separate extensions rendezvous at this versioned global. */
export const registerFeatureProvider = (
  provider: FeatureProvider,
): FeatureRegistration => {
  const host = window as unknown as Record<symbol, Registry | undefined>;
  const existing = host[REGISTRY_KEY];
  if (
    existing &&
    (existing.version !== 1 || typeof existing.register !== "function")
  ) {
    throw new Error(
      "Incompatible RoamJS feature ownership registry; reload Roam",
    );
  }
  const registry = existing || (host[REGISTRY_KEY] = createRegistry());
  return registry.register(provider);
};
