// src/mazeGenerator.js

// 1. Seeded Random Number Generator
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// 2. Daily Layout Configurator (TOUGHER)
function getDailyConfig(day) {
    // Styles rotate to keep it interesting, but ALL are hard now.
    // loops: 0 = Perfect Maze (Hardest, lots of dead ends)
    // loops: 1-2 = slightly more forgiving but still tight
    const styles = [
        { loops: 0, portals: 2 },  // Day 1: Maximum Difficulty (Perfect Maze)
        { loops: 1, portals: 1 },  // Day 2: Very Tight
        { loops: 0, portals: 3 },  // Day 3: Portal Confusion
        { loops: 2, portals: 2 },  // Day 4: Standard Hard
        { loops: 0, portals: 0 },  // Day 5: Classic Wall Maze (No Portals)
        { loops: 1, portals: 4 },  // Day 6: Chaos Portals
    ];
    const baseConfig = styles[(day - 1) % styles.length];
    
    return {
        loops: baseConfig.loops, 
        portals: baseConfig.portals
    };
}

export function generateDailyLevel(customSeed = null) {
    // 1. Determine Seed and Day
    let seedString = customSeed;
    let dayOfMonth = new Date().getDate();

    if (!seedString) {
        // Daily Mode: Seed is YYYY-MM-DD
        const d = new Date();
        seedString = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    } else {
        // Free Play: Random Seed
        dayOfMonth = Math.floor(Math.random() * 30) + 1;
    }
    
    // 2. Initialize RNG
    let seedVal = 0;
    for (let i = 0; i < seedString.length; i++) {
        seedVal += seedString.charCodeAt(i);
    }
    const rng = mulberry32(seedVal);

    // 3. Get Configuration
    const config = getDailyConfig(dayOfMonth);

    // 4. Setup Grid (10x10)
    const rows = 10;
    const cols = 10;
    let grid = Array.from({ length: rows }, () => Array(cols).fill(1));

    // 5. Carve Path (Recursive Backtracker - Creates Tough Dead Ends)
    function carve(r, c) {
        grid[r][c] = 0; 
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]].sort(() => rng() - 0.5);

        for (let [dr, dc] of directions) {
            const nr = r + (dr * 2);
            const nc = c + (dc * 2);
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
                grid[r + dr][c + dc] = 0; 
                carve(nr, nc);
            }
        }
    }

    carve(0, 0);

    // 6. Place Start (Top-Left) & End (Bottom-Right)
    grid[0][0] = 2; 
    grid[9][9] = 3; 

    // 7. Place Portals (Only if config allows)
    function placePair(val) {
        let count = 0;
        let attempts = 0;
        while (count < 2 && attempts < 100) {
            let r = Math.floor(rng() * rows);
            let c = Math.floor(rng() * cols);
            // Must be on an empty path (0), not Start(2), End(3), or Wall(1)
            if (grid[r][c] === 0 && !(r===0 && c===0) && !(r===9 && c===9)) { 
                grid[r][c] = val;
                count++;
            }
            attempts++;
        }
    }

    if (config.portals >= 1) placePair(8);
    if (config.portals >= 2) placePair(9);
    if (config.portals >= 3) placePair(8); 
    if (config.portals >= 4) placePair(9);

    // 8. Apply Minimal Loops (Strictly controlled difficulty)
    for(let i=0; i < config.loops; i++) {
        let r = Math.floor(rng() * (rows-2)) + 1;
        let c = Math.floor(rng() * (cols-2)) + 1;
        if(grid[r][c] === 1) grid[r][c] = 0;
    }

    return grid;
}