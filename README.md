# 🚀 MAZEWAYS: Portal Maze Solver

**MazeWays** is a complex, fast-paced web game challenging players to find the most efficient path through a procedurally generated maze. The core challenge involves navigating walls and portals while minimizing moves and time.

## ✨ Project Overview & Features

* **Dynamic Gameplay Modes:** Players can switch between **Standard** (no wall breaking) and **Breacher** (limited wall-breaking charges) modes.
* **Procedural Generation:** Uses a sophisticated **Seeded** random algorithm to generate unique, 10x10, solvable mazes with guaranteed paths.
* **Daily Quest:** A new, universally consistent map is generated every day, ensuring fair global competition.
* **Performance Tracking:** Scores are ranked by **Efficiency**, comparing player steps against the mathematically shortest path.
* **Persistent High Scores:** Utilizes Google Firestore for global and daily leaderboards.
* **Built-in AI Solver:** Provides hints and calculates the optimal path for ranking.

## ⚙️ Technical Stack

* **Frontend:** React (Vite)
* **Styling:** Tailwind CSS
* **Database:** Google Cloud Firestore
* **Authentication:** Firebase Authentication (Google Provider)

---

## 🧠 Core Game Logic and Algorithms

### 1. Maze Construction (`mazeGenerator.jsx`)

The maze topology is created using deterministic algorithms to ensure replayability and consistency.

* **Algorithm:** **Recursive Backtracker** (a Depth-First Search variant) is used to create a complex path structure with few natural loops.
* **Seeding:** The map is seeded based on the current date for the Daily Quest, or randomly for Free Play, ensuring that the same seed always produces the exact same maze layout.
* **Elements:** The generator strategically places walls, floors, portals (Blue and Red pairs), and the Start/Goal nodes.

### 2. AI Pathfinding and Optimization

The `Game.jsx` component uses an internal solver to handle complexity, especially when wall-breaking is possible.

* **Algorithm:** **Breadth-First Search (BFS)** is the core algorithm used because it guarantees finding the shortest path (in terms of steps) in the maze. 
* **State Tracking (BFS with K):** The BFS is modified to track the player's position *and* their remaining **Breacher charges (`k`)**. This allows the AI to calculate the true shortest path even if it involves breaking a wall.
* **Ranking Metric:** The system calculates player efficiency based on how close their steps are to the AI's calculated optimal path for the given mode ($k=0$ or $k=3$).

$$
\text{Efficiency} = \min\left(100, \left\lceil \frac{\text{Optimal Steps}}{\text{Player Steps}} \times 100 \right\rceil \right)\%
$$

---
