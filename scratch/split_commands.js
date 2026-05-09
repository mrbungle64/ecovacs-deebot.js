const fs = require('fs');
const path = require('path');

const commandFile = path.join(__dirname, '../library/command.js');
const sourceLines = fs.readFileSync(commandFile, 'utf8').split('\n');

const classes = [];
let currentState = 'IDLE';
let currentClass = { name: '', extends: '', lines: [], type: '' };
let bracketCount = 0;

let buffer = [];

for (let i = 0; i < sourceLines.length; i++) {
    const line = sourceLines[i];
    
    if (currentState === 'IDLE') {
        if (line.trim().startsWith('/**')) {
            currentState = 'IN_JSDOC';
            buffer.push(line);
        } else if (line.trim().startsWith('class ')) {
            currentState = 'IN_CLASS';
            buffer.push(line);
            const match = line.match(/class\s+([A-Za-z0-9_]+)(?:\s+extends\s+([A-Za-z0-9_]+))?\s*\{/);
            if (match) {
                currentClass.name = match[1];
                currentClass.extends = match[2] || '';
            }
            bracketCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            if (bracketCount === 0) {
                currentClass.lines = [...buffer];
                classes.push({...currentClass});
                buffer = [];
                currentClass = { name: '', extends: '', lines: [], type: '' };
                currentState = 'IDLE';
            }
        } else if (line.trim().startsWith('module.exports')) {
            // Stop at exports
            break;
        } else if (line.trim() !== '') {
            // Might be module level requires or variables, save them
            // Actually, we know what the top of the file has.
            // Let's just ignore non-class, non-jsdoc lines in IDLE
        }
    } else if (currentState === 'IN_JSDOC') {
        buffer.push(line);
        if (line.trim().startsWith('*/')) {
            currentState = 'WAIT_CLASS';
        }
    } else if (currentState === 'WAIT_CLASS') {
        buffer.push(line);
        if (line.trim().startsWith('class ')) {
            currentState = 'IN_CLASS';
            const match = line.match(/class\s+([A-Za-z0-9_]+)(?:\s+extends\s+([A-Za-z0-9_]+))?\s*\{/);
            if (match) {
                currentClass.name = match[1];
                currentClass.extends = match[2] || '';
            }
            bracketCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            if (bracketCount === 0) {
                currentClass.lines = [...buffer];
                classes.push({...currentClass});
                buffer = [];
                currentClass = { name: '', extends: '', lines: [], type: '' };
                currentState = 'IDLE';
            }
        }
    } else if (currentState === 'IN_CLASS') {
        buffer.push(line);
        bracketCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        if (bracketCount === 0) {
            currentClass.lines = [...buffer];
            classes.push({...currentClass});
            buffer = [];
            currentClass = { name: '', extends: '', lines: [], type: '' };
            currentState = 'IDLE';
        }
    }
}

// Map classes to modules
const modules = {
    base: ['VacBotCommand'],
    clean: [],
    map: [],
    info: [],
    settings: [],
    movement: [],
    purification: []
};

// Base dependencies
const extendsMap = {};
classes.forEach(c => extendsMap[c.name] = c.extends);

function getRootClass(className) {
    let curr = className;
    while (extendsMap[curr] && extendsMap[curr] !== 'VacBotCommand') {
        curr = extendsMap[curr];
    }
    return curr;
}

classes.forEach(c => {
    if (c.name === 'VacBotCommand') return;
    
    let name = c.name;
    let root = getRootClass(name);
    
    if (name.includes('Purification')) {
        modules.purification.push(name);
    } else if (root === 'Clean' || root === 'Clean_V2' || name.includes('Clean') || name.includes('Area') || name.includes('Spot') || name === 'Pause' || name === 'Resume' || name === 'Stop' || name === 'Washing') {
        modules.clean.push(name);
    } else if (name.includes('Map') || name.includes('Position') || name.includes('Relocate')) {
        modules.map.push(name);
    } else if (name.includes('Move') || name === 'Charge' || name.includes('Charge')) {
        modules.movement.push(name);
    } else if (name.startsWith('Get')) {
        modules.info.push(name);
    } else if (name.startsWith('Set') || name.startsWith('Reset')) {
        modules.settings.push(name);
    } else if (name === 'PlaySound') {
        modules.settings.push(name);
    } else if (name === 'Edge') {
        modules.clean.push(name);
    } else {
        // default
        modules.info.push(name);
    }
});

// Sort out extends dependencies to make sure parent class is in the same module or we import it
// Actually it's easier to just put classes in correct files. If a class extends a class from another module, we need to require it.
// VacBotCommand is required everywhere.

const outputDir = path.join(__dirname, '../library/commands');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Generate files
const classContentMap = {};
classes.forEach(c => {
    classContentMap[c.name] = c.lines.join('\n');
});

const moduleImports = {};
for (const mod in modules) {
    const classList = modules[mod];
    let content = `'use strict';\n\n`;
    
    if (mod === 'base') {
        content += `const tools = require('../tools');\n`;
        content += `const constants = require('../constants');\n\n`;
    } else {
        content += `const tools = require('../tools');\n`;
        content += `const constants = require('../constants');\n`;
        content += `const constants_type = require('../dictionary');\n`;
        content += `const VacBotCommand = require('./base');\n`;
        
        // Find if we need to import anything else
        const externalDeps = new Set();
        classList.forEach(cls => {
            const cObj = classes.find(c => c.name === cls);
            if (cObj && cObj.extends && cObj.extends !== 'VacBotCommand') {
                if (!classList.includes(cObj.extends)) {
                    // Depends on a class in another module
                    externalDeps.add(cObj.extends);
                }
            }
        });
        
        // Find which modules these external deps belong to
        const depModules = new Set();
        externalDeps.forEach(dep => {
            for (const m in modules) {
                if (modules[m].includes(dep)) {
                    content += `const { ${dep} } = require('./${m}');\n`;
                }
            }
        });
        content += `\n`;
    }

    classList.forEach(cls => {
        content += classContentMap[cls] + '\n\n';
    });

    content += `module.exports = {\n`;
    classList.forEach(cls => {
        content += `    ${cls},\n`;
    });
    // For base, we also default export
    if (mod === 'base') {
        content += `};\nmodule.exports.VacBotCommand = VacBotCommand;\n`;
    } else {
        content += `};\n`;
    }

    fs.writeFileSync(path.join(outputDir, `${mod}.js`), content);
}

// Generate index.js
let indexContent = `'use strict';\n\n`;
indexContent += `const VacBotCommand = require('./base');\n`;
indexContent += `const base = require('./base');\n`;
for (const mod in modules) {
    if (mod !== 'base') {
        indexContent += `const ${mod} = require('./${mod}');\n`;
    }
}
indexContent += `\nmodule.exports = VacBotCommand;\n`;
indexContent += `Object.assign(module.exports,\n`;
for (const mod in modules) {
    indexContent += `    ${mod},\n`;
}
// Manually add the SpotPurification alias
indexContent += `    { SpotPurification: clean.MapPoint_V2 }\n`;
indexContent += `);\n`;

fs.writeFileSync(path.join(outputDir, `index.js`), indexContent);

console.log("Modules generated:", Object.keys(modules).join(", "));
