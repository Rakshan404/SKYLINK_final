const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./places.db');

db.all("SELECT name, address FROM places_geo WHERE status = 'failed' LIMIT 10", (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Sample Failed Addresses:");
    rows.forEach(row => {
        console.log(`Name: ${row.name} | Address: ${row.address}`);
    });
});
