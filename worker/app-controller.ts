import { DurableObject } from 'cloudflare:workers';
import type { SessionInfo } from './types';
import type { Env } from './core-utils';
// 🤖 AI Extension Point: Add session management features
export class AppController extends DurableObject<Env> {
  private sessions = new Map<string, SessionInfo>();
  private loaded = false;
  private transactions: any[] = [];
  private loadedTransactions = false;
  private audits: any[] = [];
  private loadedAudits = false;
  private demoUsers: any[] = [];
  private loadedUsers = false;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      const stored = await this.ctx.storage.get<Record<string, SessionInfo>>('sessions') || {};
      this.sessions = new Map(Object.entries(stored));
      this.loaded = true;
    }
  }
  private async persist(): Promise<void> {
    await this.ctx.storage.put('sessions', Object.fromEntries(this.sessions));
  }
  private async ensureLoadedTransactions(): Promise<void> {
    if (!this.loadedTransactions) {
      this.transactions = (await this.ctx.storage.get<any[]>('transactions')) || [];
      this.loadedTransactions = true;
    }
  }
  private async persistTransactions(): Promise<void> {
    await this.ctx.storage.put('transactions', this.transactions);
  }
  private async ensureLoadedAudits(): Promise<void> {
    if (!this.loadedAudits) {
        this.audits = (await this.ctx.storage.get<any[]>('audits')) || [];
        this.loadedAudits = true;
    }
  }
  private async persistAudits(): Promise<void> {
      await this.ctx.storage.put('audits', this.audits);
  }
  private async ensureLoadedUsers(): Promise<void> {
    if (!this.loadedUsers) {
        this.demoUsers = [
            { email: 'demo@owner.com', password: 'pw123', role: 'Owner' },
            { email: 'demo@manager.com', password: 'pw123', role: 'Manager' },
            { email: 'demo@operator.com', password: 'pw123', role: 'Operator' },
            { email: 'demo@driver.com', password: 'pw123', role: 'Driver' },
            { email: 'demo@hr.com', password: 'pw123', role: 'HR Admin' },
        ];
        this.loadedUsers = true;
    }
  }
  async authLogin(body: { email?: string; password?: string }): Promise<{ token?: string; user?: { role: string } }> {
    await this.ensureLoadedUsers();
    const user = this.demoUsers.find(u => u.email === body.email && u.password === body.password);
    if (user) {
        const payload = `${user.email}:${user.role}:${Date.now() + 86400000}`; // 24h expiry
        const token = `jwt.${btoa(payload)}`;
        return { token, user: { role: user.role } };
    }
    return {};
  }
  async validateJWT(token: string): Promise<{ valid: boolean; role?: string }> {
    try {
        if (!token.startsWith('jwt.')) return { valid: false };
        const payload = atob(token.substring(4));
        const [email, role, expiry] = payload.split(':');
        if (Date.now() > parseInt(expiry)) {
            return { valid: false };
        }
        return { valid: true, role };
    } catch (e) {
        return { valid: false };
    }
  }
  async getTransactions(): Promise<any[]> {
    await this.ensureLoadedTransactions();
    return [...this.transactions];
  }
  async pushTransactions(newDocs: any[]): Promise<void> {
    await this.ensureLoadedTransactions();
    newDocs.forEach(doc => {
      const idx = this.transactions.findIndex(t => t.id === doc.id);
      if (idx >= 0) { this.transactions[idx] = doc; } else { this.transactions.push(doc); }
    });
    await this.persistTransactions();
  }
  async getAudits(): Promise<any[]> {
    await this.ensureLoadedAudits();
    return [...this.audits];
  }
  async pushAudits(newDocs: any[]): Promise<void> {
    await this.ensureLoadedAudits();
    newDocs.forEach(doc => {
        const idx = this.audits.findIndex(a => a.id === doc.id);
        if (idx >= 0) { this.audits[idx] = doc; } else { this.audits.push(doc); }
    });
    await this.persistAudits();
  }
  async addSession(sessionId: string, title?: string): Promise<void> {
    await this.ensureLoaded();
    const now = Date.now();
    this.sessions.set(sessionId, { id: sessionId, title: title || `Chat ${new Date(now).toLocaleDateString()}`, createdAt: now, lastActive: now });
    await this.persist();
  }
  async removeSession(sessionId: string): Promise<boolean> {
    await this.ensureLoaded();
    const deleted = this.sessions.delete(sessionId);
    if (deleted) await this.persist();
    return deleted;
  }
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = Date.now();
      await this.persist();
    }
  }
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.title = title;
      await this.persist();
      return true;
    }
    return false;
  }
  async listSessions(): Promise<SessionInfo[]> {
    await this.ensureLoaded();
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActive - a.lastActive);
  }
  async getSessionCount(): Promise<number> {
    await this.ensureLoaded();
    return this.sessions.size;
  }
  async getSession(sessionId: string): Promise<SessionInfo | null> {
    await this.ensureLoaded();
    return this.sessions.get(sessionId) || null;
  }
  async clearAllSessions(): Promise<number> {
    await this.ensureLoaded();
    const count = this.sessions.size;
    this.sessions.clear();
    await this.persist();
    return count;
  }
}