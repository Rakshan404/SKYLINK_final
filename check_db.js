const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./places.db');

db.all("SELECT count(*) as count, status FROM places_geo GROUP BY status", (err, rows) => {
    if (err) console.error(err);
    else console.log(rows);
});
