import { getDatabase } from './database';

export async function getPersonalContext(): Promise<string> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ content: string }>(
    'SELECT content FROM personal_context WHERE id = 1;'
  );
  return row?.content ?? '';
}

export async function setPersonalContext(content: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO personal_context (id, content, updated_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at;`,
    content,
    Date.now()
  );
}
