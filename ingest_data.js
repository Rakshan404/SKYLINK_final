const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const DB_PATH = './places.db';
const JSON_PATH = './restraunts.json';
const DELAY_MS = 1100; // 1.1 seconds to respect Nominatim limit (1req/sec)

const KEYS = {
    REVIEWS: "81",
    ADDRESS: "5C-829, 9th Main, 1st Block HRBR Layout, Kalyan Nagar, Bangalore",
    NAME: "OvenTreats - Patisserie.Bistro",
    RATING: "3.9",
    PLACE: "Kalyan Nagar"
};

const cleanAddress = (str) => {
    if (!str) return "";
    return str
        .replace(/\b(Opposite|Opp\.|Near|Behind|Beside|Next to|Floor|Shop No|No\.|#)\b.*?(,|$)/gi, "")
        .replace(/[()]/g, "")
        .replace(/\s+/g, " ")
        .trim();
};

const db = new sqlite3.Database(DB_PATH);

function initDB() {
    return new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS places_geo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      address TEXT UNIQUE,
      rating REAL,
      no_of_reviews INTEGER,
      place TEXT,
      lat REAL,
      lon REAL,
      geocode_source TEXT,
      geocoded_at TEXT,
      status TEXT,
      confidence REAL
    )`, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function insertOrUpdate(item, lat, lon, status, source, confidence) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`INSERT INTO places_geo (name, address, rating, no_of_reviews, place, lat, lon, geocode_source, geocoded_at, status, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(address) DO UPDATE SET
      lat=excluded.lat,
      lon=excluded.lon,
      status=excluded.status,
      geocoded_at=excluded.geocoded_at,
      confidence=excluded.confidence
    `);

        const now = new Date().toISOString();
        stmt.run(
            item.name,
            item.address,
            item.rating,
            item.reviews,
            item.place,
            lat,
            lon,
            source,
            now,
            status,
            confidence,
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
        stmt.finalize();
    });
}

function getCached(address) {
    return new Promise((resolve, reject) => {
        db.get("SELECT status FROM places_geo WHERE address = ?", [address], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function geocode(queryText) {
    try {
        const query = encodeURIComponent(queryText);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'SkyLink-Geocoder/1.0' }
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            return {
                lat: parseFloat(result.lat),
                lon: parseFloat(result.lon),
                confidence: 0.8
            };
        }
        return null;
    } catch (error) {
        console.error(`Geocode error for ${queryText}:`, error.message);
        return null;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processData() {
    await initDB();

    console.log("Reading JSON file...");
    const rawData = fs.readFileSync(JSON_PATH, 'utf8');
    const data = JSON.parse(rawData);

    // Filter valid items first to know total count
    const validItems = data.filter(item => {
        const name = item[KEYS.NAME];
        const address = item[KEYS.ADDRESS];
        // Skip junk data
        if (!name || !address || typeof name !== 'string' || name.includes('RATED') || name.includes("('Rated")) {
            return false;
        }
        return true;
    });

    // Deduplicate by address
    const uniqueItemsMap = new Map();
    for (const item of validItems) {
        const addr = item[KEYS.ADDRESS];
        if (!uniqueItemsMap.has(addr)) {
            uniqueItemsMap.set(addr, item);
        }
    }
    const uniqueItems = Array.from(uniqueItemsMap.values());

    const total = uniqueItems.length;
    console.log(`Found ${total} unique restaurants to process (deduplicated from ${validItems.length}).`);

    let processedIdx = 0;
    let skippedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    let errorCount = 0;

    for (const rawItem of uniqueItems) {
        processedIdx++;

        try {
            const name = rawItem[KEYS.NAME];
            const address = rawItem[KEYS.ADDRESS];
            const ratingStr = rawItem[KEYS.RATING];
            const reviewsStr = rawItem[KEYS.REVIEWS];
            const place = rawItem[KEYS.PLACE];

            const rating = parseFloat(ratingStr) || 0;
            const reviews = parseInt(reviewsStr) || 0;
            const item = { name, address, rating, reviews, place };

            // Check cache
            const cached = await getCached(address);
            if (cached && cached.status === 'success') {
                skippedCount++;
                if (processedIdx % 100 === 0) {
                    process.stdout.write(`\rProgress: ${processedIdx}/${total} (${((processedIdx / total) * 100).toFixed(1)}%) - Skipped: ${skippedCount} items...`);
                }
                continue;
            }

            console.log(`\n[${processedIdx}/${total}] Processing: ${name}`);

            // Strategy 1: Cleaned Address
            const cleaned = cleanAddress(address);
            // console.log(`  Cleaned: ${cleaned}`);
            let geo = await geocode(cleaned + ", Bangalore");
            let source = 'address_clean';
            await sleep(DELAY_MS);

            // Strategy 2: Name + Place + Bangalore
            if (!geo) {
                const query2 = `${name}, ${place}, Bangalore`;
                console.log(`  -> Retry 1: ${query2}`);
                geo = await geocode(query2);
                source = 'name_place';
                await sleep(DELAY_MS);
            }

            // Strategy 3: Name + Bangalore
            if (!geo) {
                const query3 = `${name}, Bangalore`;
                console.log(`  -> Retry 2: ${query3}`);
                geo = await geocode(query3);
                source = 'name_city';
                await sleep(DELAY_MS);
            }

            // Strategy 4: Place + Bangalore (Fallback)
            if (!geo) {
                const query4 = `${place}, Bangalore`;
                console.log(`  -> Retry 3 (Fallback): ${query4}`);
                geo = await geocode(query4);
                source = 'place_fallback';
                await sleep(DELAY_MS);
            }

            if (geo) {
                await insertOrUpdate(item, geo.lat, geo.lon, 'success', source, geo.confidence);
                console.log(`  -> SUCCESS (${source}): ${geo.lat}, ${geo.lon}`);
                successCount++;
                if (successCount >= 1300) {
                    console.log("\n\n--- LIMIT REACHED (1300 new items) ---");
                    console.log("Stopping process as requested.");
                    break;
                }
            } else {
                await insertOrUpdate(item, null, null, 'failed', 'all_attempts', 0);
                console.log(`  -> FAILED: Could not find location.`);
                failedCount++;
            }
        } catch (error) {
            console.error(`\n!!! ERROR processing item [${processedIdx}/${total}]: ${rawItem[KEYS.NAME]}`);
            console.error(`Error details:`, error);
            errorCount++;
            // Continue to next item
        }
    }

    console.log(`\n\n--- COMPLETED ---`);
    console.log(`Total: ${total}`);
    console.log(`Skipped (Already in DB): ${skippedCount}`);
    console.log(`Newly Success: ${successCount}`);
    console.log(`Newly Failed: ${failedCount}`);
    console.log(`Errors Encountered: ${errorCount}`);
}

processData().catch(console.error);
