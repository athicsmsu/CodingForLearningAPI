import mysql from "mysql";
import util from "util";

export const conn = mysql.createPool({
  connectionLimit: 10,
  host: "202.28.34.197",
  user: "cp_65011212145",
  password: "65011212145@csmsu",
  database: "cp_65011212145",
});
export const queryAsync = util.promisify(conn.query).bind(conn);
