/**
 * Mock RxDB implementation using localStorage.
 * Provides the same collection and database interfaces expected by the rest of the codebase.
 * All data is persisted in the browser's localStorage under keys prefixed with "suitewaste-".
 */
import { v4 as uuidv4 } from 'uuid';
/* -------------------------------------------------------------------------- */
/* Types & Interfaces                                                         */
/* -------------------------------------------------------------------------- */
export type ScaleStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'mock';
export interface HardwareStatus {
  scale: ScaleStatus;
  printer: 'connected' | 'disconnected' | 'error';
  camera: 'connected' | 'disconnected' | 'error';
}
/* Transaction record */
export interface Transaction {
  id: string;
  materialId: string;
  materialName: string;
  weight: number;
  pricePerKg: number;
  total: number;
  supplierId: string;
  timestamp: number;
  signatureData?: string; // optional signature capture
  _deleted?: boolean;
}
/* Material catalogue */
export interface Material {
  id: string;
  name: string;
  currentPrice: number;
  _deleted?: boolean;
}
/* Staff roster */
export interface Staff {
  id: string;
  name: string;
  role: 'Operator' | 'Manager' | 'Driver' | 'Admin';
  clockedIn: boolean;
  shiftStart: number | null;
  _deleted?: boolean;
}
/* Generic key/value settings */
export interface Setting {
  /** Primary identifier – mirrors the `key` for compatibility with RxCollection<T extends { id: string }> */
  id: string;
  key: string;
  value: any;
  _deleted?: boolean;
}
/* Audit Log record */
export interface AuditLog {
    id: string;
    timestamp: number;
    userId: string; // 'system' or staff ID
    action: string; // e.g., 'transaction.create', 'staff.clock_in'
    data: any; // e.g., { before: {}, after: { transaction details } }
    _deleted?: boolean;
}
/* General Ledger Entry */
export interface GLEntry {
    id: string;
    transactionId: string;
    account: string; // e.g., 'Cash', 'Revenue', 'Inventory'
    debit: number;
    credit: number;
    timestamp: number;
    _deleted?: boolean;
}
/* -------------------------------------------------------------------------- */
/* RxDB‑like Types                                                          */
/* -------------------------------------------------------------------------- */
export type RxCollection<T extends { id: string }> = {
  count: () => { exec: () => Promise<number> };
  bulkInsert: (documents: T[]) => Promise<void>;
  insert: (document: T) => Promise<void>;
  bulkUpsert: (documents: Partial<T>[]) => Promise<void>;
  upsert: (document: T) => Promise<void>;
  find: (criteria?: any) => {
    exec: () => Promise<T[]>;
    limit: (n: number) => any;
    sort: (sortObj: any) => any;
  };
  findOne: (idOrCriteria: string | any) => {
    exec: () => Promise<MockRxDocument<T> | null>;
  };
};
export type RxDatabase<C extends Record<string, any>> = {
  addCollections: (collections: {
    [K in keyof C]?: { schema: any };
  }) => Promise<void>;
} & {
  [K in keyof C]: RxCollection<C[K]>;
};
/* -------------------------------------------------------------------------- */
/* Mock RxDocument (returned by findOne)                                      */
/* -------------------------------------------------------------------------- */
export class MockRxDocument<T extends { id: string }> {
  private collection: MockRxCollection<T>;
  private doc: T;
  constructor(collection: MockRxCollection<T>, doc: T) {
    this.collection = collection;
    this.doc = doc;
  }
  /** Patch updates the stored document (partial merge). */
  async patch(updates: Partial<T>): Promise<void> {
    const index = this.collection['_data'].findIndex(d => d.id === this.doc.id);
    if (index >= 0) {
      this.collection['_data'][index] = { ...this.collection['_data'][index], ...updates };
      this.collection['_save']();
    }
  }
  /** Returns the raw document data. */
  toJSON(): T {
    return this.doc;
  }
}
/* -------------------------------------------------------------------------- */
/* Mock RxCollection implementation                                           */
/* -------------------------------------------------------------------------- */
class MockRxCollection<T extends { id: string }> {
  public _data: T[] = [];
  private readonly _storageKey: string;
  private readonly _db: () => SuiteWasteDatabase;
  constructor(storageKey: string, dbGetter: () => SuiteWasteDatabase) {
    this._storageKey = `suitewaste-${storageKey}`;
    this._db = dbGetter;
    const saved = localStorage.getItem(this._storageKey);
    if (saved) {
      try {
        this._data = JSON.parse(saved) as T[];
      } catch {
        this._data = [];
      }
    }
  }
  /** Persist the current in‑memory array to localStorage. */
  _save() {
    localStorage.setItem(this._storageKey, JSON.stringify(this._data));
  }
  /** Count non‑deleted documents. */
  count() {
    return {
      exec: async (): Promise<number> => this._data.filter(d => !(d as any)._deleted).length,
    };
  }
  /** Insert one or many documents. */
  async bulkInsert(documents: T[]) {
    this._data.push(...documents);
    this._save();
  }
  async insert(document: T) {
    await this.bulkInsert([document]);
    const db = this._db();
    if (!db) return;
    // Audit log for transactions
    if (this._storageKey === 'suitewaste-transactions') {
        const tx = document as unknown as Transaction;
        const auditEntry: AuditLog = {
            id: uuidv4(),
            timestamp: Date.now(),
            userId: 'system', // Or get current user ID
            action: 'transaction.create',
            data: { before: {}, after: document }
        };
        await db.audit_logs.insert(auditEntry);
        // Auto-post to General Ledger
        const ledgerEntries: GLEntry[] = [
            { id: uuidv4(), transactionId: tx.id, account: 'Inventory', debit: tx.total, credit: 0, timestamp: tx.timestamp },
            { id: uuidv4(), transactionId: tx.id, account: 'Cash', debit: 0, credit: tx.total, timestamp: tx.timestamp },
        ];
        await db.gl_entries.bulkInsert(ledgerEntries);
        const receiptBytes = generateEscPosReceipt(tx);
        console.log('Mock ESC/POS print:', receiptBytes);
    }
  }
  /** Upsert (insert or replace) one or many documents. */
  async bulkUpsert(documents: Partial<T>[]) {
    for (const doc of documents) {
      if (!doc.id) continue;
      const idx = this._data.findIndex(d => d.id === doc.id);
      if (idx >= 0) {
        this._data[idx] = { ...this._data[idx], ...doc } as T;
      } else {
        this._data.push(doc as T);
      }
    }
    this._save();
  }
  async upsert(document: T) {
    await this.bulkUpsert([document]);
  }
  /** Simple query builder supporting selector, limit, and sort. */
  find(criteria?: any) {
    let result = this._data.filter(d => !(d as any)._deleted);
    if (criteria?.selector) {
      const selector = criteria.selector;
      result = result.filter(doc => {
        return Object.entries(selector).every(([key, value]) => {
          if (typeof value === 'object' && value !== null && ('$gte' in value)) {
            return (doc as any)[key] >= value.$gte;
          }
          if (typeof value === 'object' && value !== null && ('$gt' in value)) {
            return (doc as any)[key] > value.$gt;
          }
          return (doc as any)[key] === value;
        });
      });
    }
    const builder: any = {
      exec: async (): Promise<T[]> => result,
      limit: (n: number) => {
        result = result.slice(0, n);
        return builder;
      },
      sort: (sortObj: any) => {
        const [field, direction] = Object.entries(sortObj)[0];
        result.sort((a: any, b: any) => {
          const av = a[field];
          const bv = b[field];
          if (direction === 'desc') {
            return av < bv ? 1 : av > bv ? -1 : 0;
          } else {
            return av > bv ? 1 : av < bv ? -1 : 0;
          }
        });
        return builder;
      },
    };
    return builder;
  }
  /** Find a single document by id or selector. */
  findOne(idOrCriteria: string | any) {
    let doc: T | undefined;
    if (typeof idOrCriteria === 'string') {
      doc = this._data.find(d => d.id === idOrCriteria && !(d as any)._deleted);
    } else if (idOrCriteria?.selector) {
      const selector = idOrCriteria.selector;
      doc = this._data.find(d => {
        if ((d as any)._deleted) return false;
        return Object.entries(selector).every(([key, value]) => (d as any)[key] === value);
      });
    }
    return {
      exec: async (): Promise<MockRxDocument<T> | null> => {
        if (!doc) return null;
        return new MockRxDocument<T>(this, doc);
      },
    };
  }
}
/* -------------------------------------------------------------------------- */
/* JSON Schemas (kept for documentation; not used by the mock)               */
/* -------------------------------------------------------------------------- */
const transactionSchema = { /* ... */ };
const materialSchema = { /* ... */ };
const staffSchema = { /* ... */ };
const settingSchema = { /* ... */ };
const auditLogSchema = { /* ... */ };
const glEntrySchema = { /* ... */ };
/* -------------------------------------------------------------------------- */
/* Seed Data                                                                  */
/* -------------------------------------------------------------------------- */
export const seedMaterials: Omit<Material, '_deleted'>[] = [
  { id: 'copper-bright', name: 'Copper (Bright)', currentPrice: 130.5 },
  { id: 'copper-heavy', name: 'Copper (Heavy)', currentPrice: 120.0 },
  { id: 'aluminium-cast', name: 'Aluminium (Cast)', currentPrice: 22.75 },
  { id: 'aluminium-extruded', name: 'Aluminium (Extruded)', currentPrice: 25.0 },
  { id: 'brass', name: 'Brass', currentPrice: 75.2 },
  { id: 'stainless-steel', name: 'Stainless Steel', currentPrice: 15.5 },
  { id: 'lead', name: 'Lead', currentPrice: 20.0 },
  { id: 'pvc-cable', name: 'PVC Cable', currentPrice: 35.8 },
];
export const seedStaff: Omit<Staff, '_deleted'>[] = [
  { id: 'staff-01', name: 'John Doe', role: 'Operator', clockedIn: false, shiftStart: null },
  { id: 'staff-02', name: 'Jane Smith', role: 'Manager', clockedIn: true, shiftStart: Date.now() - 3600000 },
  { id: 'staff-03', name: 'Mike Ross', role: 'Operator', clockedIn: true, shiftStart: Date.now() - 7200000 },
  { id: 'staff-04', name: 'Sarah Connor', role: 'Driver', clockedIn: false, shiftStart: null },
  { id: 'staff-05', name: 'Admin User', role: 'Admin', clockedIn: false, shiftStart: null },
];
export const seedAudits: Omit<AuditLog, '_deleted'>[] = [
    { id: uuidv4(), timestamp: Date.now() - 86400000, userId: 'system', action: 'system.startup', data: { message: 'System initialized' } },
    { id: uuidv4(), timestamp: Date.now() - 3600000, userId: 'staff-02', action: 'login.success', data: { ip: '192.168.1.100' } },
    { id: uuidv4(), timestamp: Date.now() - 1800000, userId: 'staff-03', action: 'staff.clock_in', data: { before: { clockedIn: false }, after: { clockedIn: true } } },
];
export const seedGLEntries: Omit<GLEntry, '_deleted'>[] = [
    { id: uuidv4(), transactionId: 'seed-tx-1', account: 'Inventory', debit: 1305, credit: 0, timestamp: Date.now() - 500000 },
    { id: uuidv4(), transactionId: 'seed-tx-1', account: 'Cash', debit: 0, credit: 1305, timestamp: Date.now() - 500000 },
    { id: uuidv4(), transactionId: 'seed-tx-2', account: 'Inventory', debit: 455, credit: 0, timestamp: Date.now() - 400000 },
    { id: uuidv4(), transactionId: 'seed-tx-2', account: 'Cash', debit: 0, credit: 455, timestamp: Date.now() - 400000 },
    { id: uuidv4(), transactionId: 'seed-expense-1', account: 'Expenses', debit: 5350.75, credit: 0, timestamp: Date.now() - 300000 },
    { id: uuidv4(), transactionId: 'seed-expense-1', account: 'Cash', debit: 0, credit: 5350.75, timestamp: Date.now() - 300000 },
];
/* -------------------------------------------------------------------------- */
/* Helper: Seed collections if they are empty                                   */
/* -------------------------------------------------------------------------- */
async function seedIfEmpty(db: SuiteWasteDatabase) {
    if ((await db.materials.count().exec()) === 0) {
        console.log('Seeding materials...');
        await db.materials.bulkInsert(seedMaterials as Material[]);
    }
    if ((await db.staff.count().exec()) === 0) {
        console.log('Seeding staff...');
        await db.staff.bulkInsert(seedStaff as Staff[]);
    }
    if ((await db.audit_logs.count().exec()) === 0) {
        console.log('Seeding audit logs...');
        await db.audit_logs.bulkInsert(seedAudits as AuditLog[]);
    }
    if ((await db.gl_entries.count().exec()) === 0) {
        console.log('Seeding GL entries...');
        await db.gl_entries.bulkInsert(seedGLEntries as GLEntry[]);
    }
}
/* -------------------------------------------------------------------------- */
/* Mock ESC/POS Receipt Generation                                            */
/* -------------------------------------------------------------------------- */
function generateEscPosReceipt(tx: Transaction): Uint8Array {
    const encoder = new TextEncoder();
    const date = new Date(tx.timestamp).toLocaleString();
    const receiptText = [
        '[C]SUITEWASTE OS RECEIPT\n',
        `[L]Date: ${date}\n`,
        `[L]Supplier: ${tx.supplierId}\n`,
        `[L]TX ID: ${tx.id.substring(0, 8)}\n`,
        '[C]--------------------------------\n',
        '[L]Material          [R]Total\n',
        `[L]${tx.materialName.padEnd(18)} [R]R ${tx.total.toFixed(2)}\n`,
        `[L](${tx.weight.toFixed(2)}kg @ R ${tx.pricePerKg.toFixed(2)}/kg)\n`,
        '[C]--------------------------------\n',
        `[L]<b>TOTAL PAID [R]R ${tx.total.toFixed(2)}</b>\n`,
        '\n',
        '[C]Thank you!\n',
        '\n\n\n',
        '[CUT]',
    ].join('');
    // This is a mock; in a real scenario, you'd convert text formatting to actual ESC/POS byte commands.
    return encoder.encode(receiptText);
}
/* -------------------------------------------------------------------------- */
/* Database singleton                                                          */
/* -------------------------------------------------------------------------- */
export type SuiteWasteCollections = {
  transactions: Transaction;
  materials: Material;
  staff: Staff;
  settings: Setting;
  audit_logs: AuditLog;
  gl_entries: GLEntry;
};
export type SuiteWasteDatabase = RxDatabase<SuiteWasteCollections>;
let dbPromise: Promise<SuiteWasteDatabase> | null = null;
/**
 * Create the mock database, initialise collections and seed data.
 */
const createDatabase = async (): Promise<SuiteWasteDatabase> => {
  console.log('Creating SuiteWaste mock database...');
  const db: any = {};
  const dbGetter = () => db as SuiteWasteDatabase;
  // addCollections mimics the RxDB API
  async function addCollections(collections: any) {
    db.transactions = new MockRxCollection<Transaction>('transactions', dbGetter);
    db.materials = new MockRxCollection<Material>('materials', dbGetter);
    db.staff = new MockRxCollection<Staff>('staff', dbGetter);
    db.settings = new MockRxCollection<Setting>('settings', dbGetter);
    db.audit_logs = new MockRxCollection<AuditLog>('audit_logs', dbGetter);
    db.gl_entries = new MockRxCollection<GLEntry>('gl_entries', dbGetter);
    console.log('Collections initialized.');
  }
  await addCollections({
    transactions: { schema: transactionSchema },
    materials: { schema: materialSchema },
    staff: { schema: staffSchema },
    settings: { schema: settingSchema },
    audit_logs: { schema: auditLogSchema },
    gl_entries: { schema: glEntrySchema },
  });
  await seedIfEmpty(db);
  console.log('Mock DB ready.');
  return db as SuiteWasteDatabase;
};
/**
 * Exported getter used throughout the app.
 */
export const getDb = (): Promise<SuiteWasteDatabase> => {
  if (!dbPromise) {
    dbPromise = createDatabase();
  }
  return dbPromise;
};