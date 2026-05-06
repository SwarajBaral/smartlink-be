import { getGoogleAccessToken } from './googleAuth';

type FsValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { timestampValue: string }
  | { nullValue: null };

type FsFields = Record<string, FsValue>;

function toFsValue(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  throw new Error(`Unsupported Firestore value type: ${typeof v}`);
}

function fromFsValue(v: FsValue): unknown {
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return parseInt(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  return null;
}

function toFields(obj: Record<string, unknown>): FsFields {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, toFsValue(v)])
  );
}

function fromFields(fields: FsFields): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fromFsValue(v)]));
}

function docName(projectId: string, collection: string, docId: string): string {
  return `projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;
}

export class FirestoreRest {
  private base: string;
  private queryBase: string;

  constructor(
    private projectId: string,
    private clientEmail: string,
    private privateKey: string
  ) {
    this.base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    this.queryBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await getGoogleAccessToken(this.clientEmail, this.privateKey);
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async set(collection: string, docId: string, data: Record<string, unknown>): Promise<void> {
    const res = await fetch(`${this.base}/${collection}/${docId}`, {
      method: 'PATCH',
      headers: await this.authHeaders(),
      body: JSON.stringify({ name: docName(this.projectId, collection, docId), fields: toFields(data) }),
    });
    if (!res.ok) throw new Error(`Firestore set failed: ${await res.text()}`);
  }

  async get(collection: string, docId: string): Promise<Record<string, unknown> | null> {
    const res = await fetch(`${this.base}/${collection}/${docId}`, {
      headers: await this.authHeaders(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Firestore get failed: ${await res.text()}`);
    const doc = await res.json<{ fields?: FsFields }>();
    if (!doc.fields) return null;
    return { ...fromFields(doc.fields), id: docId };
  }

  async update(collection: string, docId: string, data: Record<string, unknown>): Promise<void> {
    const fields = toFields(data);
    const params = new URLSearchParams();
    for (const key of Object.keys(fields)) params.append('updateMask.fieldPaths', key);

    const res = await fetch(`${this.base}/${collection}/${docId}?${params}`, {
      method: 'PATCH',
      headers: await this.authHeaders(),
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) throw new Error(`Firestore update failed: ${await res.text()}`);
  }

  async delete(collection: string, docId: string): Promise<void> {
    const res = await fetch(`${this.base}/${collection}/${docId}`, {
      method: 'DELETE',
      headers: await this.authHeaders(),
    });
    if (!res.ok) throw new Error(`Firestore delete failed: ${await res.text()}`);
  }

  async runQuery(structuredQuery: object): Promise<Record<string, unknown>[]> {
    const res = await fetch(`${this.queryBase}:runQuery`, {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify({ structuredQuery }),
    });
    if (!res.ok) throw new Error(`Firestore query failed: ${await res.text()}`);

    const rows = await res.json<Array<{ document?: { name: string; fields: FsFields } }>>();
    return rows
      .filter((r) => r.document?.fields)
      .map((r) => {
        const docId = r.document!.name.split('/').pop()!;
        return { ...fromFields(r.document!.fields), id: docId };
      });
  }
}
