const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./places.db');

db.all("SELECT status, COUNT(*) as count FROM places_geo GROUP BY status", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("DB Stats:");
    rows.forEach(row => {
        console.log(`${row.status}: ${row.count}`);
    });
});
