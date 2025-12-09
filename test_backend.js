const axios = require('axios');

async function test() {
    try {
        // Test with a viewbox around Bangalore
        const response = await axios.get('http://localhost:3001/api/places?viewbox=77.5,12.9,77.7,13.1');
        console.log("Status:", response.status);
        console.log("Data length:", response.data.length);
        if (response.data.length > 0) {
            console.log("Sample:", response.data[0]);
        }
    } catch (e) {
        console.error(e.message);
    }
}

test();
