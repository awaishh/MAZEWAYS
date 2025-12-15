# 🚀 MAZEWAYS: Portal Maze Solver

MazeWays is a fast-paced, algorithm-driven web game that challenges players to find the most efficient path through a procedurally generated maze. The objective is not just to reach the goal, but to do so using optimal decision-making, minimizing both steps and time while navigating walls, portals, and special mechanics.

The project combines game development with data structures and algorithms, making logic and optimization the core focus rather than just UI.

## ✨ Project Overview & Key Features

MazeWays provides a logic-first gameplay experience where algorithms directly influence player performance and ranking.

### 🎮 Dynamic Gameplay Modes

MazeWays offers two distinct gameplay modes that significantly change the problem complexity.

Standard Mode  
- Walls are completely impassable  
- The maze becomes a classic shortest-path problem  

Breacher Mode  
- Players are given a limited number of wall-breaking charges  
- Introduces strategic trade-offs between breaking walls and taking longer paths  
- Converts the maze into a state-space search problem  

Players can switch modes dynamically, and rankings are calculated independently for each mode.

## 🧩 Procedural Maze Generation

- Maze size: 10 × 10  
- Every generated maze is guaranteed to be solvable  
- Uses a seeded random generation algorithm for consistency  

Daily Quest  
- The maze seed is derived from the current date  
- Every player globally receives the exact same maze  
- Ensures fair and competitive gameplay  

Free Play  
- Uses random seeds  
- Generates a new maze on each run  
- Designed for practice and experimentation  

## 🗓️ Daily & Global Rankings

MazeWays supports two leaderboard systems.

Global Ranking  
- Based on Free Play runs  
- Mazes are randomly generated  
- Used mainly for practice and exploration  
- Scores are stored in the global leaderboard  

Daily Ranking  
- Same maze for all players on that day  
- Rankings are directly comparable  
- Skill-based rather than luck-based competition  
- A new challenge is available every day  

## 📊 Performance Tracking & Efficiency

Instead of raw scores, MazeWays uses an efficiency-based ranking system.

Efficiency is calculated as:  
Efficiency = min(100, (Optimal Steps / Player Steps) × 100)

- Optimal steps are calculated using the AI solver  
- Encourages optimal decision-making  
- Prevents brute-force gameplay from ranking highly  

## 🧠 Core Game Logic & Algorithms

### Maze Construction (mazeGenerator.js)

Maze generation uses Recursive Backtracking, a variant of Depth-First Search (DFS).

Algorithm Overview  
1. Start from the initial cell  
2. Randomly explore neighboring cells  
3. Remove walls to carve corridors  
4. Continue recursively until the maze is complete  

Properties  
- Complex paths with dead ends  
- Minimal natural loops  
- Deterministic when seeded for Daily Quest  
- Randomized for Free Play  

Maze elements include walls, walkable paths, start and goal nodes, and paired portals.

### AI Pathfinding & Optimization

The game uses a built-in AI solver implemented using Breadth-First Search (BFS).

Why BFS is used  
- The maze grid is unweighted  
- BFS guarantees the shortest path  
- Deterministic and efficient  

BFS Variants  

Standard Mode BFS  
State: (row, column)

Breacher Mode BFS  
State: (row, column, remainingWallBreaks)

This extended BFS allows the AI to calculate the true optimal path even when wall-breaking is allowed.

### Built-in AI Solver

The AI solver is used to  
- Validate maze solvability  
- Compute the optimal solution path  
- Generate hint paths for players  
- Calculate efficiency for leaderboard ranking  

There is no machine learning involved.  
The AI is deterministic, explainable, and follows the same rules as the player.

## 🏗️ Architect Mode (Builder)

Builder Mode allows players to design and test their own mazes.

Builder Features  
- Interactive 10 × 10 grid editor  
- Tools to place walls, floors, goals, and portals  
- Maps are saved locally  
- Instantly playable in game mode  

Feature Request System  
- Players can press the Request Feature button  
- The custom map is sent to a moderation queue  
- Moderators can review and feature selected maps  
- Prevents leaderboard abuse while encouraging creativity  

Custom Builder maps do not affect daily or global rankings.

## ⚙️ Technical Stack

Frontend: React (Vite)  
Styling: Tailwind CSS  
Database: Google Cloud Firestore  
Authentication: Firebase Authentication (Google Provider)  
Deployment: Vercel  

## 🎯 Summary

MazeWays is a logic-first game project where algorithms drive gameplay, BFS and DFS are applied in real scenarios, deterministic generation ensures fairness, and rankings reward optimal problem-solving. The project demonstrates how data structures and algorithms can be integrated into an interactive game system rather than remaining purely theoretical.

## 👤 Author

Awaish
