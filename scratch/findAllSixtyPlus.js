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

// Sort groups by size descending
groups.sort((a, b) => b.length - a.length);

console.log(`Found ${groups.length} groups of models with similarity >= 60%.`);

// Output the results in markdown structure
let markdownOutput = `# Model Groups (Similarity >= 60%)\n\n`;
markdownOutput += `Total groups found: ${groups.length}\n\n`;

groups.forEach((group, index) => {
    markdownOutput += `## Group ${index + 1} (${group.length} models)\n`;
    
    // Let's print details of the models in this group
    group.forEach(classid => {
        const p = classToProduct[classid];
        markdownOutput += `- **${p.name}** (Class ID: \`${classid}\` | Model: \`${p.model}\` | UILogicId: \`${p.UILogicId}\` | SmartType: \`${p.smartType}\`)\n`;
    });
    markdownOutput += `\n`;
});

fs.writeFileSync(path.join(__dirname, 'sixty_plus_groups.md'), markdownOutput);
console.log('Results written to sixty_plus_groups.md');
