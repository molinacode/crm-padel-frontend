type Filter =
  | { type: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is'; column: string; value: unknown }
  | { type: 'in'; column: string; value: unknown[] }
  | { type: 'or'; raw: string; column?: string };

interface QueryPlan {
  table: string;
  op: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  select?: string;
  data?: unknown;
  filters: Filter[];
  order: Array<{ column: string; ascending?: boolean }>;
  limit?: number;
  single?: boolean;
  maybeSingle?: boolean;
  head?: boolean;
  count?: string;
  onConflict?: string;
}

interface QueryResult {
  data: any;
  error: any;
  count?: number | null;
}

async function execute(plan: QueryPlan): Promise<QueryResult> {
  try {
    const response = await fetch('/api/query', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    const json = (await response.json()) as QueryResult;
    if (!response.ok && !json.error) {
      return { data: null, error: { message: `HTTP ${response.status}`, details: '', hint: '', code: String(response.status) } };
    }
    if (json.error && !json.error.details) {
      json.error = { details: '', hint: '', code: json.error.code || '', name: 'PostgrestError', toJSON() { return this; }, ...json.error };
    }
    return json;
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Error de red',
        details: '',
        hint: '',
        code: '',
        name: 'PostgrestError',
        toJSON() {
          return this;
        },
      },
    };
  }
}

class QueryBuilder {
  private plan: QueryPlan;

  constructor(table: string) {
    this.plan = {
      table,
      op: 'select',
      select: '*',
      filters: [],
      order: [],
    };
  }

  select(columns: string = '*', options?: { head?: boolean; count?: string }) {
    this.plan.select = columns;
    if (options?.head) this.plan.head = true;
    if (options?.count) this.plan.count = options.count;
    return this;
  }

  insert(data: unknown) {
    this.plan.op = 'insert';
    this.plan.data = data;
    return this;
  }

  update(data: unknown) {
    this.plan.op = 'update';
    this.plan.data = data;
    return this;
  }

  upsert(data: unknown, options?: { onConflict?: string }) {
    this.plan.op = 'upsert';
    this.plan.data = data;
    if (options?.onConflict) this.plan.onConflict = options.onConflict;
    return this;
  }

  delete() {
    this.plan.op = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this.plan.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.plan.filters.push({ type: 'neq', column, value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.plan.filters.push({ type: 'gt', column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.plan.filters.push({ type: 'gte', column, value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.plan.filters.push({ type: 'lt', column, value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.plan.filters.push({ type: 'lte', column, value });
    return this;
  }

  like(column: string, value: unknown) {
    this.plan.filters.push({ type: 'like', column, value });
    return this;
  }

  ilike(column: string, value: unknown) {
    this.plan.filters.push({ type: 'ilike', column, value });
    return this;
  }

  is(column: string, value: unknown) {
    this.plan.filters.push({ type: 'is', column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.plan.filters.push({ type: 'in', column, value });
    return this;
  }

  or(raw: string) {
    this.plan.filters.push({ type: 'or', raw });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.plan.order.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(n: number) {
    this.plan.limit = n;
    return this;
  }

  single() {
    this.plan.single = true;
    return this;
  }

  maybeSingle() {
    this.plan.maybeSingle = true;
    return this;
  }

  then(
    onfulfilled?: ((value: QueryResult) => any) | null,
    onrejected?: ((reason: unknown) => any) | null
  ) {
    return execute(this.plan).then(onfulfilled, onrejected);
  }
}

const POLL_INTERVAL_MS = 60_000;

const authListeners = new Set<(event: string, session: unknown) => void>();

function notifyAuth(event: string, session: unknown) {
  authListeners.forEach(listener => listener(event, session));
}

async function fetchMe() {
  const response = await fetch('/api/auth/me', { credentials: 'include' });
  if (response.status === 401) return { user: null, userData: null, session: null };
  const json = await response.json();
  const user = json.user
    ? {
        id: json.user.id,
        email: json.user.email,
        created_at: json.userData?.created_at,
        user_metadata: { avatar_url: json.userData?.foto_url },
      }
    : null;
  return {
    user,
    userData: json.userData || null,
    session: user ? { user } : null,
  };
}

const storage = {
  from(bucket: string) {
    return {
      async upload(fileName: string, file: File, _options?: unknown) {
        const body = new FormData();
        body.append('file', file);
        const response = await fetch(`/api/storage/${bucket}/${encodeURIComponent(fileName)}`, {
          method: 'POST',
          credentials: 'include',
          body,
        });
        const json = await response.json();
        if (!response.ok) return { error: { message: json.error || 'Error subiendo archivo' } };
        return { data: json, error: null };
      },
      getPublicUrl(fileName: string) {
        const publicUrl = `/${bucket}/${fileName}`;
        return { data: { publicUrl } };
      },
      async remove(paths: string[]) {
        await Promise.all(
          paths.filter(Boolean).map(p =>
            fetch(`/api/storage/${bucket}/${encodeURIComponent(p)}`, {
              method: 'DELETE',
              credentials: 'include',
            })
          )
        );
        return { error: null };
      },
    };
  },
};

const supabaseClient = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  storage,
  rpc(..._args: unknown[]) {
    return Promise.resolve({
      data: null,
      error: { message: 'RPC no está expuesto en la API propia', details: '', hint: '', code: '' },
    });
  },
  // No hay realtime en la API propia: se sustituye por un sondeo periódico que
  // dispara los mismos manejadores que usaba `postgres_changes`.
  channel(..._args: unknown[]) {
    const handlers: Array<() => void> = [];
    return {
      on(...onArgs: unknown[]) {
        const handler = onArgs[onArgs.length - 1];
        if (typeof handler === 'function') handlers.push(handler as () => void);
        return this;
      },
      subscribe() {
        const timer = window.setInterval(() => {
          if (document.visibilityState !== 'visible') return;
          handlers.forEach(handler => handler());
        }, POLL_INTERVAL_MS);
        return {
          unsubscribe() {
            window.clearInterval(timer);
          },
        };
      },
    };
  },
  auth: {
    async getSession() {
      try {
        const me = await fetchMe();
        return { data: { session: me.session }, error: null };
      } catch (error) {
        return {
          data: { session: null },
          error: { message: error instanceof Error ? error.message : 'Error de sesión' },
        };
      }
    },
    async getUser() {
      const me = await fetchMe();
      return { data: { user: me.user }, error: null };
    },
    async signInWithPassword() {
      window.location.assign('/api/auth/login');
      return { data: { session: null, user: null }, error: null };
    },
    async signOut() {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      let redirect = '/';
      try {
        const json = await response.json();
        if (json.redirect) redirect = json.redirect;
      } catch {
        /* ignore */
      }
      notifyAuth('SIGNED_OUT', null);
      window.location.assign(redirect);
    },
    async updateUser() {
      return {
        data: { user: null },
        error: {
          message: 'La contraseña se cambia en https://auth.v3sports.es',
        },
      };
    },
    onAuthStateChange(callback: (event: string, session: unknown) => void) {
      authListeners.add(callback);
      void fetchMe().then(me => callback(me.session ? 'SIGNED_IN' : 'SIGNED_OUT', me.session));
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(callback);
            },
          },
        },
      };
    },
  },
};

export const supabase: any = supabaseClient;

export async function fetchAuthProfile() {
  return fetchMe();
}

export async function patchAuthProfile(nombre?: string, telefono?: string) {
  const response = await fetch('/api/auth/profile', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, telefono }),
  });
  return response.json();
}
