// lib/db.ts

export async function queryD1(db: any, sql: string, params: any[] = []) {
  try {
    const stmt = db.prepare(sql);
    const result = await stmt.bind(...params).all();
    return result.results || [];
  } catch (error) {
    console.error("Database Error:", error);
    throw error;
  }
}