import { Pool } from 'pg';

const globalRef = global as unknown as { __pgPool?: Pool };

if (!globalRef.__pgPool) {
  globalRef.__pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

export const pool = globalRef.__pgPool;

// Types for separate screening database (following sales dashboard pattern)
export type Candidate = {
  id: string;
  phone_number: string;
  name: string;
  created_at: Date;
  updated_at: Date;
};

export type PendingSession = {
  id: string;
  candidate_phone: string;
  agent_key: string;
  status: 'pending' | 'in_progress';
  created_at: Date;
  updated_at: Date;
};

export type CallSession = {
  id: string;
  candidate_phone: string;
  agent_key: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  transcription?: string;
  analysis?: any;
  audio_url?: string;
  conversation_id?: string;
  duration_seconds?: number;
  started_at?: Date;
  ended_at?: Date;
  created_at: Date;
  updated_at: Date;
};

export type CallRow = CallSession & {
  name: string; // Joined from candidates table
};

// Create or get candidate (like consultants in sales dashboard)
export async function createOrGetCandidate(phoneNumber: string, name: string): Promise<Candidate> {
  // First try to get existing candidate
  const existing = await pool.query(
    'SELECT * FROM candidates WHERE phone_number = $1',
    [phoneNumber]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }
  
  // Create new candidate if doesn't exist
  const { rows } = await pool.query(
    `INSERT INTO candidates (phone_number, name, created_at, updated_at) 
     VALUES ($1, $2, NOW(), NOW()) 
     RETURNING *`,
    [phoneNumber, name]
  );
  return rows[0];
}

// Create pending session before call (same pattern as sales dashboard)
export async function createPendingSession(params: {
  phoneNumber: string;
  candidateName: string;
  agentKey: string;
}): Promise<PendingSession> {
  // Ensure candidate exists
  await createOrGetCandidate(params.phoneNumber, params.candidateName);
  
  const { rows } = await pool.query(
    `INSERT INTO pending_sessions (candidate_phone, agent_key, status, created_at, updated_at) 
     VALUES ($1, $2, 'pending', NOW(), NOW()) 
     RETURNING *`,
    [params.phoneNumber, params.agentKey]
  );
  return rows[0];
}

// Create call session (equivalent to createCallRecord but in separate table)
export async function createCallSession(params: {
  phoneNumber: string;
  candidateName: string;
  conversationId?: string;
}): Promise<CallSession> {
  // Ensure candidate exists
  await createOrGetCandidate(params.phoneNumber, params.candidateName);

  const { rows } = await pool.query(
    `INSERT INTO call_sessions (
      candidate_phone, agent_key, status, conversation_id, started_at, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW()) 
     RETURNING *`,
    [
      params.phoneNumber,
      'ksa_screening_interview_agent',
      'in_progress',
      params.conversationId || null,
    ]
  );
  return rows[0];
}

// Update call session with webhook data (same pattern as sales dashboard)
export async function updateSessionByPhone(
  phoneNumber: string, 
  updates: {
    transcription?: string;
    analysis?: any;
    status?: string;
    audioUrl?: string;
    endedAt?: string;
    durationSeconds?: number;
  }
) {
  const setFields = [];
  const values: any[] = [phoneNumber];
  let paramCount = 2;

  if (updates.transcription !== undefined) {
    setFields.push(`transcription = $${paramCount++}`);
    values.push(updates.transcription);
  }
  if (updates.analysis !== undefined) {
    setFields.push(`analysis = $${paramCount++}`);
    values.push(JSON.stringify(updates.analysis));
  }
  if (updates.status !== undefined) {
    setFields.push(`status = $${paramCount++}`);
    values.push(updates.status);
  }
  if (updates.audioUrl !== undefined) {
    setFields.push(`audio_url = $${paramCount++}`);
    values.push(updates.audioUrl);
  }
  if (updates.endedAt !== undefined) {
    setFields.push(`ended_at = $${paramCount++}`);
    values.push(updates.endedAt);
  }
  if (updates.durationSeconds !== undefined) {
    setFields.push(`duration_seconds = $${paramCount++}`);
    values.push(updates.durationSeconds);
  }

  setFields.push(`updated_at = NOW()`);

  await pool.query(
    `UPDATE call_sessions SET ${setFields.join(', ')} WHERE candidate_phone = $1 AND status = 'in_progress'`,
    values
  );
}

// Delete pending session after call starts (same as sales dashboard)
export async function deletePendingSession(phoneNumber: string) {
  await pool.query(
    `DELETE FROM pending_sessions WHERE candidate_phone = $1`,
    [phoneNumber]
  );
}

// Get call history with pagination support
export async function getCallHistory(
  limit = 20, 
  offset = 0, 
  searchTerm?: string
): Promise<{ calls: CallRow[]; totalCount: number }> {
  let whereClause = '';
  let searchParams: any[] = [];
  let paramCount = 3; // Starting from $3 since $1 is limit, $2 is offset

  // Add search functionality
  if (searchTerm && searchTerm.trim()) {
    whereClause = `WHERE (c.name ILIKE $${paramCount} OR cs.candidate_phone ILIKE $${paramCount + 1} OR cs.status ILIKE $${paramCount + 2})`;
    const searchPattern = `%${searchTerm.trim()}%`;
    searchParams = [searchPattern, searchPattern, searchPattern];
  }

  // Get total count for pagination
  const countQuery = `
    SELECT COUNT(*) as total
    FROM call_sessions cs
    JOIN candidates c ON cs.candidate_phone = c.phone_number
    ${whereClause}
  `;
  
  const { rows: countRows } = await pool.query(countQuery, searchParams);
  const totalCount = parseInt(countRows[0].total);

  // Get paginated data
  const dataQuery = `
    SELECT cs.id, cs.candidate_phone, c.name, cs.agent_key,
           cs.status, cs.transcription, cs.analysis, cs.audio_url,
           cs.conversation_id, cs.duration_seconds, cs.started_at,
           cs.ended_at, cs.created_at, cs.updated_at
    FROM call_sessions cs
    JOIN candidates c ON cs.candidate_phone = c.phone_number
    ${whereClause}
    ORDER BY cs.created_at DESC 
    LIMIT $1 OFFSET $2
  `;

  const { rows } = await pool.query(dataQuery, [limit, offset, ...searchParams]);
  
  return {
    calls: rows,
    totalCount
  };
}

export default pool;