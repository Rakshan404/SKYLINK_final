const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./places.db');

db.all("SELECT name FROM places_geo WHERE status = 'success'", (err, rows) => {
    if (err) console.error(err);
    else console.log(rows);
});
