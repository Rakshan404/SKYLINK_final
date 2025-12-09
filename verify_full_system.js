const axios = require('axios');

async function verify() {
    try {
        console.log("1. Verifying Data Source (restraunts.json)...");
        const bangaloreViewbox = "77.3,12.8,77.9,13.2";

        // Search for 'Black Pepper' which we confirmed is in the DB
        const res1 = await axios.get(`http://localhost:3001/api/places?viewbox=${bangaloreViewbox}&q=Black Pepper`);

        if (res1.data.length > 0) {
            const match = res1.data.find(r => r.name.includes("Black Pepper"));
            if (match) {
                console.log("   [PASS] Found 'Black Pepper' from JSON data.");
                console.log(`   Name: ${match.name}`);
                console.log(`   Address: ${match.address}`);
            } else {
                console.log("   [FAIL] 'Black Pepper' not found in results.");
            }
        } else {
            console.log("   [FAIL] No results returned.");
        }

        console.log("\n2. Verifying Scoring & Multiple Options...");
        const users = [
            { lat: 12.9716, lng: 77.6412 }, // Indiranagar
            { lat: 12.9600, lng: 77.6380 }  // Domlur
        ];
        const usersParam = encodeURIComponent(JSON.stringify(users));

        const res2 = await axios.get(`http://localhost:3001/api/places?viewbox=${bangaloreViewbox}&users=${usersParam}`);

        console.log(`   Total Options Returned: ${res2.data.length}`);
        if (res2.data.length > 1) {
            console.log("   [PASS] Returned multiple options.");
        } else {
            console.log("   [FAIL] Returned 0 or 1 option.");
        }

        if (res2.data.length > 0) {
            const top = res2.data[0];
            console.log("   Top Recommendation Scores:");
            console.log(`   - Total: ${top.scores.total}`);
            console.log(`   - Fairness: ${top.scores.fairness}`);
            console.log(`   - Proximity: ${top.scores.proximity}`);
            console.log(`   - Rating: ${top.scores.rating}`);

            if (top.scores.total > 0 && top.scores.fairness > 0) {
                console.log("   [PASS] Scoring logic is active.");
            } else {
                console.log("   [FAIL] Scores seem invalid.");
            }
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

verify();
