const fs = require('fs');
const JSON_PATH = './restraunts.json';
const KEYS = {
    ADDRESS: "5C-829, 9th Main, 1st Block HRBR Layout, Kalyan Nagar, Bangalore",
    NAME: "OvenTreats - Patisserie.Bistro"
};

const rawData = fs.readFileSync(JSON_PATH, 'utf8');
const data = JSON.parse(rawData);

const validItems = data.filter(item => {
    const name = item[KEYS.NAME];
    const address = item[KEYS.ADDRESS];
    if (!name || !address || typeof name !== 'string' || name.includes('RATED') || name.includes("('Rated")) {
        return false;
    }
    return true;
});

const uniqueAddresses = new Set();
validItems.forEach(item => {
    uniqueAddresses.add(item[KEYS.ADDRESS]);
});

console.log(`Total items: ${data.length}`);
console.log(`Valid items: ${validItems.length}`);
console.log(`Unique valid addresses: ${uniqueAddresses.size}`);
