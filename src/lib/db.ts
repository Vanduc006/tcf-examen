import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client dùng service_role key — chạy server-side ONLY
// Bypasses RLS nhưng RLS vẫn được bật để bảo vệ nếu ai dùng anon key
let _adminClient: any = null;

export function getAdminClient(): any {
  if (!_adminClient) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );
    }
    _adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
  return _adminClient;
}

// Helper để truy vấn SQL raw qua Supabase (PostgreSQL)
export async function query<T>(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<T> {
  const client = getAdminClient();
  // Chuyển ? sang $1, $2... cho PostgreSQL
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);

  const { data, error } = await (client as any).rpc("execute_sql", {
    sql_query: pgSql,
    sql_params: params,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

// Kiểu kết quả cho INSERT/UPDATE/DELETE
export type ResultSetHeader = { rowCount: number; insertId: number };
