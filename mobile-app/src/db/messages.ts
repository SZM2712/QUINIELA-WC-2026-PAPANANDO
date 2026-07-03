import { getDatabase } from './database';
import { ChatMessage, ChatRole, ModelSource } from '../ai/types';

interface MessageRow {
  id: number;
  role: ChatRole;
  content: string;
  model_used: ModelSource | null;
  created_at: number;
}

function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    modelUsed: row.model_used,
    createdAt: row.created_at,
  };
}

export async function listMessages(): Promise<ChatMessage[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MessageRow>(
    'SELECT id, role, content, model_used, created_at FROM messages ORDER BY id ASC;'
  );
  return rows.map(rowToMessage);
}

export async function insertMessage(
  role: ChatRole,
  content: string,
  modelUsed: ModelSource | null
): Promise<ChatMessage> {
  const db = await getDatabase();
  const createdAt = Date.now();
  const result = await db.runAsync(
    'INSERT INTO messages (role, content, model_used, created_at) VALUES (?, ?, ?, ?);',
    role,
    content,
    modelUsed,
    createdAt
  );
  return { id: result.lastInsertRowId, role, content, modelUsed, createdAt };
}

export async function clearMessages(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM messages;');
}
