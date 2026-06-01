const fs = require('fs');
const path = require('path');
const { calculateModelSimilarity } = require('../library/modelResolver.js');

// Load productIotMap
const productIotMapPath = path.join(__dirname, '../library/productIotMap.json');
const productIotMap = JSON.parse(fs.readFileSync(productIotMapPath, 'utf8'));

// Filter out products that have valid product details
const items = productIotMap.filter(item => item.classid && item.product);

console.log(`Loaded ${items.length} product mappings.`);

// Build adjacency list for graph of similarity >= 60%
const adj = {};
items.forEach(item => {
    adj[item.classid] = [];
});

for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
        const itemA = items[i];
        const itemB = items[j];

        const score = calculateModelSimilarity(itemA.product, itemB.product);
        if (score >= 60) {
            adj[itemA.classid].push({ classid: itemB.classid, score });
            adj[itemB.classid].push({ classid: itemA.classid, score });
        }
    }
}

// Find connected components (groups of relatives/variants/clones >= 60)
const visited = new Set();
const groups = [];

for (const item of items) {
    const classid = item.classid;
    if (!visited.has(classid)) {
        const component = [];
        const queue = [classid];
        visited.add(classid);

        while (queue.length > 0) {
            const current = queue.shift();
            component.push(current);

            for (const neighbor of adj[current]) {
                if (!visited.has(neighbor.classid)) {
                    visited.add(neighbor.classid);
                    queue.push(neighbor.classid);
                }
            }
        }

        if (component.length > 1) {
            groups.push(component);
        }
    }
}

// Map classid to product info for rich display
const classToProduct = {};
items.forEach(item => {
    classToProduct[item.classid] = item.product;
});

const { getProductSeries, extractPlatformCodename, getManufacturer } = require('../library/modelResolver.js');

/**
 * Generates a descriptive name for a group of products.
 */
function nameGroup(products) {
    const brands = new Set();
    const series = new Set();
    const platforms = new Set();

    products.forEach(p => {
        const brand = getManufacturer(p).trim();
        brands.add(brand.charAt(0).toUpperCase() + brand.slice(1));

        const s = getProductSeries(p).trim();
        if (s && s !== 'unknown') {
            series.add(s.toUpperCase());
        }

        const plat = extractPlatformCodename(p.model);
        if (plat) {
            platforms.add(plat.trim().toUpperCase());
        }
    });

    let brandStr = Array.from(brands).join(' / ');
    let seriesList = Array.from(series).sort();
    let seriesStr = seriesList.join(', ');
    let platStr = Array.from(platforms).sort().join(', ');

    const descriptions = {
        'X': 'Premium / Flaggschiff',
        'T': 'Obere Mittelklasse / Performance',
        'N': 'Budget / Mittelklasse mit LiDAR',
        'U': 'Einstiegsklasse (Gyro)',
        'G': 'GOAT Mähroboter',
        'Z': 'Airbot Luftreiniger',
        'W': 'WINBOT Fensterreiniger',
        'K': 'yeedi Einstiegsklasse',
        'VAC': 'yeedi vac-Serie (vSLAM)',
        'FLOOR': 'yeedi Floor-Serie',
        'C': 'yeedi LiDAR-Mittelklasse',
        'Y': 'yeedi LiDAR-Mittelklasse',
        'M': 'yeedi Premium / OMNI',
        'S': 'yeedi Premium / OMNI'
    };

    let desc = '';
    for (const s of seriesList) {
        const prefix = s.match(/^[A-Z]+/);
        if (prefix && descriptions[prefix[0]]) {
            desc = descriptions[prefix[0]];
            break;
        }
        if (descriptions[s]) {
            desc = descriptions[s];
            break;
        }
    }

    if (seriesStr) {
        let name = `${brandStr} ${seriesStr}`;
        if (desc) name = `${name} [${desc}]`;
        if (platStr) {
            name += ` (${platStr})`;
        }
        return name;
    }

    if (platStr) {
        return `${brandStr} Platform ${platStr}`;
    }

    return `${brandStr} Unknown Series`;
}

// Sort groups by size descending
groups.sort((a, b) => b.length - a.length);

console.log(`Found ${groups.length} groups of models with similarity >= 60%.`);

// Output the results in markdown structure
let markdownOutput = `# Model Groups (Similarity >= 60%)\n\n`;
markdownOutput += `Total groups found: ${groups.length}\n\n`;

groups.forEach((group, index) => {
    const groupProducts = group.map(classid => classToProduct[classid]);
    const groupName = nameGroup(groupProducts);

    markdownOutput += `## Group ${index + 1}: ${groupName} (${group.length} models)\n`;

    // Let's print details of the models in this group
    group.forEach(classid => {
        const p = classToProduct[classid];
        markdownOutput += `- **${p.name.trim()}** (Class ID: \`${classid}\` | Model: \`${p.model}\` | UILogicId: \`${p.UILogicId}\` | SmartType: \`${p.smartType}\`)\n`;
    });
    markdownOutput += `\n`;
});

fs.writeFileSync(path.join(__dirname, 'sixty_plus_groups.md'), markdownOutput);
console.log('Results written to sixty_plus_groups.md');
