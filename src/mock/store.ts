/**
 * MediPick Mock Engine — Store (Mock Database)
 *
 * Acts as the in-memory + AsyncStorage-persisted database for the mock engine.
 * Mirrors the PostgreSQL table structure defined in V002–V019 SQL migrations.
 *
 * Data that persists across app restarts (via AsyncStorage):
 *   - customers (registered users)
 *   - refresh_tokens (active sessions)
 *   - customer_pharmacy_favorites
 *   - orders
 *
 * Data seeded fresh on every app start (from seed.ts):
 *   - pharmacies
 *   - medicines
 *   - health_tips
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { REFRESH_TOKEN_TTL_MS } from './jwt';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const KEYS = {
  CUSTOMERS:          '@mock_db/customers',
  REFRESH_TOKENS:     '@mock_db/refresh_tokens',
  FAVORITES:          '@mock_db/favorites',
  ORDERS:             '@mock_db/orders',
  NOTIFICATIONS:      '@mock_db/notifications',
} as const;

// ─── Table Row Types (match PostgreSQL column names → camelCase) ──────────────

export interface MockCustomer {
  id:                       string;
  phoneNumber:              string;
  surname:                  string;
  email:                    string | null;
  isVerified:               boolean;
  strikes:                  number;
  strikeLimit:              number;
  isLocked:                 boolean;
  lockedUntil:              string | null;
  pushNotificationsEnabled: boolean;
  emailReceiptsEnabled:     boolean;
  pushToken:                string | null;
  createdAt:                string;  // ISO 8601
  updatedAt:                string;
}

export interface MockRefreshToken {
  id:         string;
  customerId: string;
  tokenHash:  string;   // The raw refresh token string (mock: no hashing needed)
  expiresAt:  string;   // ISO 8601
  revoked:    boolean;
  createdAt:  string;
}

export interface MockFavorite {
  id:         string;
  customerId: string;
  pharmacyId: string;
  createdAt:  string;
}

export interface MockNotification {
  id:         string;
  customerId: string;
  orderId:    string | null;
  type:       string;
  title:      string;
  body:       string;
  read:       boolean;
  createdAt:  string;
}

// ─── Generic Helpers ──────────────────────────────────────────────────────────

function nowISO(): string {
  return new Date().toISOString();
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function load<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function save<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

// ─── Customers Table ──────────────────────────────────────────────────────────

export const CustomerStore = {
  async findByPhone(phone: string): Promise<MockCustomer | null> {
    const rows = await load<MockCustomer>(KEYS.CUSTOMERS);
    return rows.find((c) => c.phoneNumber === phone) ?? null;
  },

  async findById(id: string): Promise<MockCustomer | null> {
    const rows = await load<MockCustomer>(KEYS.CUSTOMERS);
    return rows.find((c) => c.id === id) ?? null;
  },

  /** Upsert: create if new phone, update surname/email if existing */
  async upsert(phone: string, surname: string, email?: string): Promise<MockCustomer> {
    const rows = await load<MockCustomer>(KEYS.CUSTOMERS);
    const idx  = rows.findIndex((c) => c.phoneNumber === phone);

    if (idx !== -1) {
      // Update existing
      rows[idx] = {
        ...rows[idx],
        surname,
        email:     email ?? rows[idx].email,
        updatedAt: nowISO(),
      };
      await save(KEYS.CUSTOMERS, rows);
      return rows[idx];
    }

    // Create new customer
    const newCustomer: MockCustomer = {
      id:                       uuid(),
      phoneNumber:              phone,
      surname,
      email:                    email ?? null,
      isVerified:               true,
      strikes:                  0,
      strikeLimit:              5,
      isLocked:                 false,
      lockedUntil:              null,
      pushNotificationsEnabled: true,
      emailReceiptsEnabled:     true,
      pushToken:                null,
      createdAt:                nowISO(),
      updatedAt:                nowISO(),
    };
    rows.push(newCustomer);
    await save(KEYS.CUSTOMERS, rows);
    return newCustomer;
  },

  async update(id: string, patch: Partial<MockCustomer>): Promise<MockCustomer | null> {
    const rows = await load<MockCustomer>(KEYS.CUSTOMERS);
    const idx  = rows.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch, updatedAt: nowISO() };
    await save(KEYS.CUSTOMERS, rows);
    return rows[idx];
  },

  async incrementStrikes(id: string): Promise<MockCustomer | null> {
    const customer = await this.findById(id);
    if (!customer) return null;
    const newStrikes = customer.strikes + 1;
    const isLocked = newStrikes >= customer.strikeLimit;
    const lockedUntil = isLocked ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : customer.lockedUntil; // Lock for 15 mins
    return this.update(id, { strikes: newStrikes, isLocked, lockedUntil });
  },

  async unlockCustomer(id: string): Promise<MockCustomer | null> {
    return this.update(id, { strikes: 0, isLocked: false, lockedUntil: null });
  }
};

// ─── Refresh Tokens Table ─────────────────────────────────────────────────────

export const RefreshTokenStore = {
  async create(customerId: string, token: string): Promise<MockRefreshToken> {
    const rows = await load<MockRefreshToken>(KEYS.REFRESH_TOKENS);

    // Revoke any existing active tokens for this customer (one session at a time)
    const updated = rows.map((r) =>
      r.customerId === customerId ? { ...r, revoked: true } : r,
    );

    const newToken: MockRefreshToken = {
      id:         uuid(),
      customerId,
      tokenHash:  token,
      expiresAt:  new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString(),
      revoked:    false,
      createdAt:  nowISO(),
    };
    updated.push(newToken);
    await save(KEYS.REFRESH_TOKENS, updated);
    return newToken;
  },

  async findValid(token: string): Promise<MockRefreshToken | null> {
    const rows = await load<MockRefreshToken>(KEYS.REFRESH_TOKENS);
    const row  = rows.find((r) => r.tokenHash === token && !r.revoked);
    if (!row) return null;
    if (new Date(row.expiresAt) < new Date()) return null;  // Expired
    return row;
  },

  /** Token rotation: revoke old token, issue new one */
  async rotate(oldToken: string, customerId: string, newToken: string): Promise<MockRefreshToken | null> {
    const rows = await load<MockRefreshToken>(KEYS.REFRESH_TOKENS);
    const idx  = rows.findIndex((r) => r.tokenHash === oldToken);
    if (idx === -1) return null;
    rows[idx].revoked = true;

    const rotated: MockRefreshToken = {
      id:         uuid(),
      customerId,
      tokenHash:  newToken,
      expiresAt:  new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString(),
      revoked:    false,
      createdAt:  nowISO(),
    };
    rows.push(rotated);
    await save(KEYS.REFRESH_TOKENS, rows);
    return rotated;
  },

  async revokeByCustomer(customerId: string): Promise<void> {
    const rows    = await load<MockRefreshToken>(KEYS.REFRESH_TOKENS);
    const updated = rows.map((r) =>
      r.customerId === customerId ? { ...r, revoked: true } : r,
    );
    await save(KEYS.REFRESH_TOKENS, updated);
  },
};

// ─── Favorites Table ──────────────────────────────────────────────────────────

export const FavoriteStore = {
  async findByCustomer(customerId: string): Promise<MockFavorite[]> {
    const rows = await load<MockFavorite>(KEYS.FAVORITES);
    return rows.filter((f) => f.customerId === customerId);
  },

  async findByCustomerAndPharmacy(customerId: string, pharmacyId: string): Promise<MockFavorite | null> {
    const rows = await load<MockFavorite>(KEYS.FAVORITES);
    return rows.find((f) => f.customerId === customerId && f.pharmacyId === pharmacyId) ?? null;
  },

  async add(customerId: string, pharmacyId: string): Promise<MockFavorite> {
    const existing = await this.findByCustomerAndPharmacy(customerId, pharmacyId);
    if (existing) return existing;  // Already favorited (idempotent)

    const rows = await load<MockFavorite>(KEYS.FAVORITES);
    const fav: MockFavorite = {
      id:         uuid(),
      customerId,
      pharmacyId,
      createdAt:  nowISO(),
    };
    rows.push(fav);
    await save(KEYS.FAVORITES, rows);
    return fav;
  },

  async remove(favoriteId: string, customerId: string): Promise<boolean> {
    const rows    = await load<MockFavorite>(KEYS.FAVORITES);
    const filtered = rows.filter(
      (f) => !(f.id === favoriteId && f.customerId === customerId),
    );
    if (filtered.length === rows.length) return false;  // Not found
    await save(KEYS.FAVORITES, filtered);
    return true;
  },
};

// ─── Notifications Table ──────────────────────────────────────────────────────

export const NotificationStore = {
  async findByCustomer(
    customerId: string,
    opts: { unreadOnly?: boolean; limit?: number } = {},
  ): Promise<MockNotification[]> {
    const rows    = await load<MockNotification>(KEYS.NOTIFICATIONS);
    let filtered  = rows.filter((n) => n.customerId === customerId);
    if (opts.unreadOnly) filtered = filtered.filter((n) => !n.read);
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return opts.limit ? filtered.slice(0, opts.limit) : filtered;
  },

  async unreadCount(customerId: string): Promise<number> {
    const rows = await load<MockNotification>(KEYS.NOTIFICATIONS);
    return rows.filter((n) => n.customerId === customerId && !n.read).length;
  },

  async markRead(notificationId: string): Promise<void> {
    const rows = await load<MockNotification>(KEYS.NOTIFICATIONS);
    const idx  = rows.findIndex((n) => n.id === notificationId);
    if (idx !== -1) {
      rows[idx].read = true;
      await save(KEYS.NOTIFICATIONS, rows);
    }
  },

  async markAllRead(customerId: string): Promise<number> {
    const rows    = await load<MockNotification>(KEYS.NOTIFICATIONS);
    let count     = 0;
    const updated = rows.map((n) => {
      if (n.customerId === customerId && !n.read) {
        count++;
        return { ...n, read: true };
      }
      return n;
    });
    await save(KEYS.NOTIFICATIONS, updated);
    return count;
  },

  async create(notif: Omit<MockNotification, 'id' | 'createdAt'>): Promise<MockNotification> {
    const rows = await load<MockNotification>(KEYS.NOTIFICATIONS);
    const newN: MockNotification = { ...notif, id: uuid(), createdAt: nowISO() };
    rows.push(newN);
    await save(KEYS.NOTIFICATIONS, rows);
    return newN;
  },
};

// ─── Orders Table ──────────────────────────────────────────────────────────────
export interface MockOrder {
  id: string;
  customerId: string;
  [key: string]: any; // We'll store the full Order object here for simplicity
}

export const OrderStore = {
  async findByCustomer(customerId: string): Promise<MockOrder[]> {
    const rows = await load<MockOrder>(KEYS.ORDERS);
    
    // Quick dev-hack to force the rating into the user's cached DB so they can see the demo
    let modified = false;
    rows.forEach((o) => {
      if (o.state === 'COMPLETED') {
        if (o.orderNumber === '#MP123502') { // City Health Pharmacy
          // Add to City Health ONLY
          if (!o.rating) {
            o.rating = { overall: 5, service: 5, availability: 4, pickup: 5, comment: "Excellent service and the pharmacist was very helpful!" };
            modified = true;
          }
        } else {
          // Strip from EVERYTHING else
          if (o.rating) {
            delete o.rating;
            modified = true;
          }
        }
      }
    });
    if (modified) await save(KEYS.ORDERS, rows);

    return rows.filter((o) => o.customerId === customerId);
  },

  async findById(id: string): Promise<MockOrder | null> {
    const rows = await load<MockOrder>(KEYS.ORDERS);
    const order = rows.find((o) => o.id === id) ?? null;
    
    // Quick dev-hack to force the rating into the user's cached DB
    if (order && order.state === 'COMPLETED') {
      if (order.orderNumber === '#MP123502') { // City Health Pharmacy
        if (!order.rating) {
          order.rating = { overall: 5, service: 5, availability: 4, pickup: 5, comment: "Excellent service and the pharmacist was very helpful!" };
          await save(KEYS.ORDERS, rows);
        }
      } else {
        if (order.rating) {
          delete order.rating;
          await save(KEYS.ORDERS, rows);
        }
      }
    }
    
    return order;
  },

  async create(order: MockOrder): Promise<MockOrder> {
    const rows = await load<MockOrder>(KEYS.ORDERS);
    rows.push(order);
    await save(KEYS.ORDERS, rows);
    return order;
  },

  async update(id: string, patch: Partial<MockOrder>): Promise<MockOrder | null> {
    const rows = await load<MockOrder>(KEYS.ORDERS);
    const idx = rows.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch };
    await save(KEYS.ORDERS, rows);
    return rows[idx];
  }
};

// ─── Dev Utility ──────────────────────────────────────────────────────────────

/**
 * Wipes ALL mock database state from AsyncStorage.
 * Use only in development / test reset flows.
 */
export async function clearMockDatabase(): Promise<void> {
  await Promise.all(Object.values(KEYS).map((k) => AsyncStorage.removeItem(k)));
  console.warn('[MockDB] All mock data cleared.');
}
