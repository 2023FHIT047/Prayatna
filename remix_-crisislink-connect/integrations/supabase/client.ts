import { createClient } from '@supabase/supabase-js';

// India Bounding Box: [South, West], [North, East]
export const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5546079, 68.1113787],
  [35.6745457, 97.395561]
];

export const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

let supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Normalize URL: If it's just a project ID, convert to full Supabase URL
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

const isValidUrl = (url: string) => {
  try {
    const newUrl = new URL(url);
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

export const supabase = (supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as any, {
      get(_, prop) {
        if (prop === 'auth') {
          return new Proxy({} as any, {
            get(_, authProp) {
              if (authProp === 'onAuthStateChange') return () => ({ data: { subscription: { unsubscribe: () => {} } } });
              if (authProp === 'getSession') return async () => ({ data: { session: null } });
              if (authProp === 'getUser') return async () => ({ data: { user: null } });
              if (authProp === 'signOut') return async () => ({ error: null });
              return () => { console.warn(`Supabase Auth method "${String(authProp)}" called without valid credentials.`); return Promise.resolve({ data: null, error: null }); };
            }
          });
        }
        if (prop === 'from') {
          return () => {
            const chain: any = new Proxy({}, {
              get(_, chainProp) {
                if (typeof chainProp === 'symbol') return undefined;
                if (chainProp === 'then') {
                  return (resolve: any) => resolve({ data: [], error: null, count: 0 });
                }
                return () => chain;
              }
            });
            return chain;
          };
        }
        if (prop === 'channel') {
          return () => ({
            on: function() { return this; },
            subscribe: function() { return this; },
            unsubscribe: function() { return this; }
          });
        }
        if (prop === 'removeChannel') {
          return () => {};
        }
        if (prop === 'rpc') {
          return () => Promise.resolve({ data: null, error: null });
        }
        
        // Fallback for any other property access
        return () => {
          console.warn(`Supabase method "${String(prop)}" called without valid credentials.`);
          return { data: null, error: null };
        };
      }
    });
