const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const path = require('path');
const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'places.db');

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(DB_PATH);

// IN-MEMORY CACHE
let PLACES_CACHE = [];

function loadCache() {
    db.all("SELECT * FROM places_geo WHERE status = 'success'", (err, rows) => {
        if (err) {
            console.error("Error loading cache:", err);
        } else {
            PLACES_CACHE = rows;
            console.log(`Loaded ${PLACES_CACHE.length} places into memory.`);
        }
    });
}

// Initial load
loadCache();

// Refresh cache every 5 minutes (in case ingestion is running)
setInterval(loadCache, 5 * 60 * 1000);

// Helper to calculate distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

async function searchNominatim(query, viewbox) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=1&limit=30`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'SkyLink-Backend/1.0' }
        });
        return response.data.map(item => ({
            name: item.display_name.split(',')[0],
            display_name: item.display_name,
            address: item.display_name,
            rating: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1), // Mock rating for external results
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            source: 'nominatim'
        }));
    } catch (error) {
        console.error("Nominatim error:", error.message);
        return [];
    }
}

app.get('/api/places', async (req, res) => {
    const { viewbox, users, q } = req.query;

    if (!viewbox) {
        return res.status(400).json({ error: "Missing viewbox param (minLon,minLat,maxLon,maxLat)" });
    }

    const [minLon, minLat, maxLon, maxLat] = viewbox.split(',').map(parseFloat);

    // 1. Filter from In-Memory Cache
    let localResults = PLACES_CACHE.filter(p =>
        p.lat >= minLat && p.lat <= maxLat &&
        p.lon >= minLon && p.lon <= maxLon
    );

    // If query provided, filter local results
    if (q) {
        const qLower = q.toLowerCase();
        localResults = localResults.filter(p =>
            (p.name && p.name.toLowerCase().includes(qLower)) ||
            (p.place && p.place.toLowerCase().includes(qLower))
        );
    }

    let allRows = localResults;

    // 2. Nominatim Search (if q is provided)
    if (q) {
        const nominatimResults = await searchNominatim(q, viewbox);
        allRows = [...allRows, ...nominatimResults];
    }

    // Optimization Logic
    let parsedUsers = [];
    if (users) {
        try {
            parsedUsers = JSON.parse(users);
        } catch (e) {
            console.error("Failed to parse users", e);
        }
    }

    const scoredRows = allRows.map(row => {
        // Calculate Fairness and Proximity if users exist
        let fairnessScore = 100;
        let proximityScore = 100;
        let gap = 0;
        let distToCenter = 0;

        if (parsedUsers.length > 0) {
            // Fairness (Gap)
            const distances = parsedUsers.map(u => getDistanceFromLatLonInKm(u.lat, u.lng, row.lat, row.lon));
            const maxDist = Math.max(...distances);
            const minDist = Math.min(...distances);
            gap = maxDist - minDist;
            fairnessScore = Math.max(0, 100 - (gap * 4));

            // Proximity (Distance to Centroid)
            const centerLat = parsedUsers.reduce((sum, u) => sum + u.lat, 0) / parsedUsers.length;
            const centerLng = parsedUsers.reduce((sum, u) => sum + u.lng, 0) / parsedUsers.length;
            distToCenter = getDistanceFromLatLonInKm(centerLat, centerLng, row.lat, row.lon);
            // Penalize 10 points per km away from center
            proximityScore = Math.max(0, 100 - (distToCenter * 10));
        }

        // Rating score (0-5 -> 0-100)
        const ratingScore = (row.rating || 0) * 20;

        // Combined Score
        // Weight: 20% Rating, 40% Fairness, 40% Proximity (Center)
        let totalScore = ratingScore;
        if (parsedUsers.length > 0) {
            totalScore = (ratingScore * 0.2) + (fairnessScore * 0.4) + (proximityScore * 0.4);
        }

        return {
            ...row,
            display_name: row.display_name || `${row.name}, ${row.address || ''}`,
            lat: row.lat,
            lon: row.lon,
            scores: {
                total: totalScore.toFixed(0),
                fairness: fairnessScore.toFixed(0),
                proximity: proximityScore.toFixed(0),
                rating: row.rating,
                safety: 90,
                gap: gap.toFixed(1),
                dist: distToCenter.toFixed(1)
            }
        };
    });

    // Sort by Total Score descending
    scoredRows.sort((a, b) => parseFloat(b.scores.total) - parseFloat(a.scores.total));

    // Limit to 60
    const topResults = scoredRows.slice(0, 60);

    res.json(topResults);
});

// --- TOMTOM ROUTING API ---
const TOMTOM_API_KEY = 'sdzQqXJ0hQKanaHi0jmyNwqcuBokTRwY'; // <--- REPLACE THIS WITH YOUR KEY

app.get('/api/route', async (req, res) => {
    const { startLat, startLng, endLat, endLng } = req.query;

    if (!startLat || !startLng || !endLat || !endLng) {
        return res.status(400).json({ error: "Missing start/end coordinates" });
    }

    try {
        // TomTom Routing API format: point1:point2
        const locations = `${startLat},${startLng}:${endLat},${endLng}`;
        const url = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=${TOMTOM_API_KEY}&traffic=true&travelMode=car`;

        console.log(`Fetching route from TomTom: ${locations}`);
        const response = await axios.get(url);

        if (response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            const summary = route.summary;
            const points = route.legs[0].points; // Array of {latitude, longitude}

            // Convert to format expected by frontend (array of [lat, lng])
            const coordinates = points.map(p => [p.latitude, p.longitude]);

            res.json({
                coordinates: coordinates,
                durationSeconds: summary.travelTimeInSeconds,
                distanceMeters: summary.lengthInMeters,
                trafficDelay: summary.trafficDelayInSeconds
            });
        } else {
            res.status(404).json({ error: "No route found" });
        }
    } catch (error) {
        console.error("TomTom API Error:", error.message);
        if (error.response) {
            console.error("TomTom Response:", error.response.data);
        }
        res.status(500).json({ error: "Failed to fetch route" });
    }
});

// --- TOMTOM SEARCH API (Autofill) ---
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?key=${TOMTOM_API_KEY}&limit=5&countrySet=IN`;
        const response = await axios.get(url);
        if (response.data && response.data.results) {
            const results = response.data.results.map(r => ({
                name: r.address.freeformAddress,
                lat: r.position.lat,
                lon: r.position.lon
            }));
            res.json(results);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error("TomTom Search Error:", error.message);
        res.json([]);
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
