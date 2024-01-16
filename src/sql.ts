import mariadb from "mariadb";

const pool = mariadb.createPool({
  host: Bun.env.db_host,
  user: Bun.env.db_user,
  database: Bun.env.db_name,
  password: Bun.env.db_password,
  connectionLimit: 5,
});

type SQLValues<S> = SQLValuesHelper<S, never>;
type SQLValuesHelper<S, Acc> = S extends `${string}(:${infer E}, ${infer Rest})`
  ? SQLValuesHelper<Rest, E | Acc>
  : S extends `:${infer E}, ${infer Rest}`
  ? SQLValuesHelper<Rest, E | Acc>
  : S extends `:${infer E}`
  ? SQLValuesHelper<"", E | Acc>
  : S extends ""
  ? Acc
  : never;

export class sql {
  static async execute<T extends string>(sql: T, params?: Object) {
    const connection = await pool.getConnection();
    const result = await connection.query(
      { namedPlaceholders: true, sql },
      params
    );
    await connection.release();
    return result;
  }

  static async batch<T extends string>(
    sql: SQLValues<T> extends never ? never : T,
    values: { [Property in SQLValues<T>]: any }[]
  ): Promise<mariadb.UpsertResult[]> {
    const connection = await pool.getConnection();
    const result = await connection.batch(
      { namedPlaceholders: true, sql },
      values
    );
    await connection.release();
    return result instanceof Array ? result : [result];
  }
}
