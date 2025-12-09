const fs = require('fs');

try {
    const rawData = fs.readFileSync('restraunts.json', 'utf8');
    const data = JSON.parse(rawData);

    console.log(`Total records: ${data.length}`);

    let validCount = 0;
    let sample = [];

    for (const item of data) {
        // Keys are dynamic, so we need to iterate over entries
        // Based on visual inspection:
        // "81": no_of_reviews
        // "5C-829...": address
        // "OvenTreats...": name
        // "3.9": rating
        // "Kalyan Nagar": place

        // It seems the keys are the values?
        // Let's print the entries of the first 5 items
        if (sample.length < 5) {
            sample.push(Object.entries(item));
        }
    }

    console.log(JSON.stringify(sample, null, 2));

} catch (err) {
    console.error(err);
}
