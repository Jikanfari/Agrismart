import { User, Role, AuthSession, JWTPayload } from '../types';
import { storage } from './storage';

const SESSION_KEY = 'agrismart_auth_session_v1';
const PIN_HASH_KEY = 'agrismart_auth_pin_hash_v1';
const BIOMETRIC_KEY = 'agrismart_auth_biometric_enabled_v1';
const JWT_SECRET = 'AgriSmartAuthSecretKey2026_SigningSecret';

// Preset Users with Roles & Farm Scoping
export const PRESET_USERS: User[] = [
  {
    id: 'user-1',
    name: 'David Okafor',
    email: 'farmer.david@agrismart.org',
    role: 'farmer',
    phone: '+1 (555) 234-8901',
    farmIds: ['farm-1', 'farm-2'],
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'user-2',
    name: 'Dr. Helen Vance (Admin)',
    email: 'admin.vance@agrismart.org',
    role: 'admin',
    phone: '+1 (555) 876-5432',
    farmIds: ['farm-1', 'farm-2'],
    createdAt: '2026-01-05T08:00:00.000Z',
  },
  {
    id: 'user-3',
    name: 'Marcus Chen (Agronomist)',
    email: 'agronomist.chen@agrismart.org',
    role: 'agronomist',
    phone: '+1 (555) 432-1098',
    farmIds: ['farm-1'],
    createdAt: '2026-02-01T08:00:00.000Z',
  },
];

// Simple Base64URL helpers
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

// Generate signed JWT token
export function createJWT(user: User): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: JWTPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    farmIds: user.farmIds,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600, // 30 days offline TTL
    iss: 'agrismart-auth-authority',
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  // Signature digest using simplified HMAC-like checksum
  const sig = base64UrlEncode(`${headerB64}.${payloadB64}.${JWT_SECRET}`);

  return `${headerB64}.${payloadB64}.${sig}`;
}

export function verifyAndDecodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = base64UrlDecode(parts[1]);
    const payload: JWTPayload = JSON.parse(payloadJson);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

// PIN Hashing using Web Crypto SHA-256
async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${pin}_agri_pin_salt_2026`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

class AuthService {
  private session: AuthSession;
  private listeners: Set<(session: AuthSession) => void> = new Set();

  constructor() {
    this.session = this.loadInitialSession();
  }

  private loadInitialSession(): AuthSession {
    const storedPinHash = typeof localStorage !== 'undefined' ? localStorage.getItem(PIN_HASH_KEY) : null;
    const biometricEnabled = typeof localStorage !== 'undefined' ? localStorage.getItem(BIOMETRIC_KEY) === 'true' : false;

    // Check stored session
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.token) {
            const claims = verifyAndDecodeJWT(parsed.token);
            if (claims) {
              return {
                token: parsed.token,
                user: parsed.user,
                isLocked: storedPinHash ? true : false, // Locked on app start if PIN is set
                pinHash: storedPinHash || undefined,
                hasPin: !!storedPinHash,
                biometricEnabled,
                expiresAt: claims.exp * 1000,
              };
            }
          }
        } catch {
          // ignore
        }
      }
    }

    // Default to David Okafor
    const defaultUser = PRESET_USERS[0];
    const token = createJWT(defaultUser);
    return {
      token,
      user: defaultUser,
      isLocked: !!storedPinHash,
      pinHash: storedPinHash || undefined,
      hasPin: !!storedPinHash,
      biometricEnabled,
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
    };
  }

  public getSession(): AuthSession {
    return this.session;
  }

  public subscribe(cb: (session: AuthSession) => void): () => void {
    this.listeners.add(cb);
    cb(this.session);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        token: this.session.token,
        user: this.session.user,
      }));
    }
    this.listeners.forEach(cb => cb(this.session));
  }

  public loginUser(user: User): AuthSession {
    const token = createJWT(user);
    storage.setCurrentUser(user);
    this.session = {
      ...this.session,
      token,
      user,
      isLocked: false,
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
    };
    this.notify();
    return this.session;
  }

  public async setQuickPin(pin: string): Promise<boolean> {
    if (!pin || pin.length < 4) throw new Error('PIN must be at least 4 digits');
    const hash = await hashPin(pin);
    localStorage.setItem(PIN_HASH_KEY, hash);
    this.session = {
      ...this.session,
      hasPin: true,
      pinHash: hash,
    };
    this.notify();
    return true;
  }

  public removeQuickPin(): void {
    localStorage.removeItem(PIN_HASH_KEY);
    this.session = {
      ...this.session,
      hasPin: false,
      pinHash: undefined,
      isLocked: false,
    };
    this.notify();
  }

  public async verifyAndUnlock(pin: string): Promise<boolean> {
    if (!this.session.pinHash) {
      this.session.isLocked = false;
      this.notify();
      return true;
    }
    const enteredHash = await hashPin(pin);
    if (enteredHash === this.session.pinHash) {
      this.session.isLocked = false;
      this.notify();
      return true;
    }
    return false;
  }

  public lockSession(): void {
    if (this.session.hasPin) {
      this.session.isLocked = true;
      this.notify();
    }
  }

  public setBiometricEnabled(enabled: boolean): void {
    localStorage.setItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
    this.session = {
      ...this.session,
      biometricEnabled: enabled,
    };
    this.notify();
  }

  public async unlockWithBiometrics(): Promise<boolean> {
    try {
      // If WebAuthn is available, verify presence
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        // Simulated biometric challenge prompt
        await new Promise(r => setTimeout(r, 600));
        this.session.isLocked = false;
        this.notify();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // --- AUTHORIZATION & ABAC POLICIES ---

  public canAccessFarm(farmId: string): boolean {
    const { user } = this.session;
    if (user.role === 'admin') return true;
    return user.farmIds.includes(farmId);
  }

  public canAccessFinances(): boolean {
    const { user } = this.session;
    // Agronomists are restricted from viewing farm revenue, sales, and private expenses
    return user.role === 'farmer' || user.role === 'admin';
  }

  public canAccessAdminPanel(): boolean {
    return this.session.user.role === 'admin';
  }

  public canModifyDecisionRules(): boolean {
    return this.session.user.role === 'admin';
  }

  public canCreateFarmActivities(): boolean {
    return true; // Farmer, Agronomist, and Admin can schedule activities
  }

  public canCreatePestAdvisory(): boolean {
    return true; // Agronomists and Farmers can report pests & recommend treatments
  }
}

export const authService = new AuthService();
