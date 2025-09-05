import mysql from "mysql";
import util from "util";

export const conn = mysql.createPool({
  connectionLimit: 10,
  host: "phpmyadmin.alwaysdata.com",
  user: "athijd",
  password: "Aa11bb22.",
  database: "athijd_historyplay",
});
export const queryAsync = util.promisify(conn.query).bind(conn);
