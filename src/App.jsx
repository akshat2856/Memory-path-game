import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy } from 'lucide-react';

const MemoryPathGame = () => {
  const [gameState, setGameState] = useState('menu'); // menu, memorize, play, gameOver
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [path, setPath] = useState([]);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [showingPath, setShowingPath] = useState(false);
  const [shake, setShake] = useState(false);
  const [explodedBlock, setExplodedBlock] = useState(null);
  const [gridSize, setGridSize] = useState({ rows: 5, cols: 5 });

  const generatePath = (rows, cols, length) => {
    const path = [0]; // Start at top-left
    let currentPos = 0;
    let lastDirection = null;

    for (let i = 0; i < length - 1; i++) {
      const possibleMoves = [];
      const currentRow = Math.floor(currentPos / cols);
      const currentCol = currentPos % cols;

      // Define all possible directions with weights
      const directions = [];
      
      // Can move right
      if (currentCol < cols - 1) {
        directions.push({ pos: currentPos + 1, dir: 'right' });
      }
      // Can move down
      if (currentRow < rows - 1) {
        directions.push({ pos: currentPos + cols, dir: 'down' });
      }
      // Can move diagonally down-right
      if (currentCol < cols - 1 && currentRow < rows - 1) {
        directions.push({ pos: currentPos + cols + 1, dir: 'diag-right' });
      }
      // Can move diagonally down-left
      if (currentCol > 0 && currentRow < rows - 1) {
        directions.push({ pos: currentPos + cols - 1, dir: 'diag-left' });
      }
      // Can move left (backtrack horizontally)
      if (currentCol > 0 && Math.random() > 0.5) {
        directions.push({ pos: currentPos - 1, dir: 'left' });
      }
      // Can move up (occasional backtrack)
      if (currentRow > 0 && Math.random() > 0.7) {
        directions.push({ pos: currentPos - cols, dir: 'up' });
      }

      // Prefer changing direction to make pattern tricky
      const filteredDirections = directions.filter(d => {
        // Avoid immediate reverse moves
        if (lastDirection === 'right' && d.dir === 'left') return false;
        if (lastDirection === 'left' && d.dir === 'right') return false;
        if (lastDirection === 'up' && d.dir === 'down') return false;
        if (lastDirection === 'down' && d.dir === 'up') return false;
        // Don't revisit blocks
        if (path.includes(d.pos)) return false;
        return true;
      });

      const availableMoves = filteredDirections.length > 0 ? filteredDirections : directions.filter(d => !path.includes(d.pos));
      
      if (availableMoves.length === 0) break;

      // Bias towards direction changes for trickier patterns
      const nextMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      path.push(nextMove.pos);
      currentPos = nextMove.pos;
      lastDirection = nextMove.dir;
    }

    return path;
  };

  const startGame = () => {
    setRound(1);
    setScore(0);
    startRound(1);
  };

  const startRound = (roundNum) => {
    const rows = Math.min(5 + Math.floor(roundNum / 3), 8);
    const cols = Math.min(5 + Math.floor(roundNum / 3), 8);
    const pathLength = Math.min(6 + Math.floor(roundNum * 1.2), rows * cols - 2);
    
    setGridSize({ rows, cols });
    const newPath = generatePath(rows, cols, pathLength);
    setPath(newPath);
    setPlayerPosition(0);
    setGameState('memorize');
    setShowingPath(true);

    // Show path for decreasing time as rounds progress
    const showTime = Math.max(1500, 3000 - roundNum * 100);
    setTimeout(() => {
      setShowingPath(false);
      setGameState('play');
    }, showTime);
  };

  const handleBlockClick = (index) => {
    if (gameState !== 'play') return;

    const nextPositionInPath = playerPosition + 1;

    if (path[nextPositionInPath] === index) {
      setPlayerPosition(nextPositionInPath);
      setScore(score + 10);

      // Check if player reached the end
      if (nextPositionInPath === path.length - 1) {
        setTimeout(() => {
          const newRound = round + 1;
          setRound(newRound);
          startRound(newRound);
        }, 500);
      }
    } else {
      // Wrong block - show explosion
      setExplodedBlock(index);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => {
        setGameState('gameOver');
        setExplodedBlock(null);
        if (score > highScore) {
          setHighScore(score);
        }
      }, 1200);
    }
  };

  const getBlockStyle = (index) => {
    const isInPath = path.includes(index);
    const isCurrentPosition = path[playerPosition] === index;
    const isNextInPath = showingPath && isInPath;
    const pathIndex = path.indexOf(index);
    const isCompletedPath = pathIndex >= 0 && pathIndex < playerPosition;
    const isExploded = explodedBlock === index;

    let bgColor = 'bg-slate-700';
    let borderColor = 'border-slate-600';

    if (isExploded) {
      bgColor = 'bg-red-600';
      borderColor = 'border-red-500';
    } else if (isCurrentPosition) {
      bgColor = 'bg-emerald-500';
      borderColor = 'border-emerald-400';
    } else if (isCompletedPath) {
      bgColor = 'bg-emerald-600/30';
      borderColor = 'border-emerald-500/30';
    } else if (isNextInPath) {
      bgColor = 'bg-blue-500';
      borderColor = 'border-blue-400';
    }

    return `${bgColor} ${borderColor} border-2 rounded-lg transition-all duration-300 hover:scale-95 cursor-pointer shadow-lg aspect-square flex items-center justify-center`;
  };

  const renderGrid = () => {
    const blocks = [];
    for (let i = 0; i < gridSize.rows * gridSize.cols; i++) {
      const isExploded = explodedBlock === i;
      blocks.push(
        <div
          key={i}
          onClick={() => handleBlockClick(i)}
          className={`${getBlockStyle(i)} ${shake ? 'animate-pulse' : ''} ${isExploded ? 'animate-bounce' : ''}`}
          style={{
            animation: showingPath && path.includes(i) 
              ? `glow 0.5s ease-in-out ${path.indexOf(i) * 0.2}s` 
              : isExploded
              ? 'explode 0.6s ease-out'
              : 'none'
          }}
        >
          {isExploded && <span className="text-4xl">💣</span>}
        </div>
      );
    }
    return blocks;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <style>{`
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 1), 0 0 30px rgba(59, 130, 246, 0.8); }
        }
        @keyframes explode {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); box-shadow: 0 0 30px rgba(239, 68, 68, 1), 0 0 50px rgba(239, 68, 68, 0.8); }
          100% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>

      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Memory Path</h1>
          <p className="text-slate-400 text-lg">Remember the path and reach the exit</p>
        </div>

        {/* Stats Bar */}
        {gameState !== 'menu' && (
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 mb-6 flex justify-around items-center border border-slate-700">
            <div className="text-center">
              <div className="text-slate-400 text-sm">Round</div>
              <div className="text-white text-2xl font-bold">{round}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-400 text-sm">Score</div>
              <div className="text-emerald-400 text-2xl font-bold">{score}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-400 text-sm flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                Best
              </div>
              <div className="text-yellow-400 text-2xl font-bold">{highScore}</div>
            </div>
          </div>
        )}

        {/* Game Status */}
        {gameState === 'memorize' && (
          <div className="text-center mb-6 bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
            <p className="text-blue-300 text-lg font-semibold">📍 Memorize the path!</p>
          </div>
        )}

        {gameState === 'play' && (
          <div className="text-center mb-6 bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4">
            <p className="text-emerald-300 text-lg font-semibold">🎯 Now walk the path from memory!</p>
          </div>
        )}

        {/* Game Area */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700 shadow-2xl">
          {gameState === 'menu' && (
            <div className="text-center py-16">
              <div className="mb-8">
                <div className="text-6xl mb-4">🧠</div>
                <h2 className="text-3xl font-bold text-white mb-4">Test Your Memory</h2>
                <p className="text-slate-300 mb-6 max-w-md mx-auto">
                  Watch the safe path light up, memorize it, then navigate through the blocks
                  without falling. Each round gets harder!
                </p>
              </div>
              <button
                onClick={startGame}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
              >
                <Play className="w-6 h-6" />
                Start Game
              </button>
            </div>
          )}

          {(gameState === 'memorize' || gameState === 'play') && (
            <div
              className="grid gap-4 mx-auto"
              style={{
                gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))`,
                maxWidth: `${gridSize.cols * 90}px`,
              }}
            >
              {renderGrid()}
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">💥</div>
              <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
              <p className="text-slate-300 mb-2">You reached Round {round}</p>
              <p className="text-emerald-400 text-xl font-bold mb-8">Final Score: {score}</p>
              {score === highScore && score > 0 && (
                <p className="text-yellow-400 mb-6 flex items-center gap-2 justify-center">
                  <Trophy className="w-5 h-5" />
                  New High Score!
                </p>
              )}
              <button
                onClick={startGame}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
              >
                <RotateCcw className="w-6 h-6" />
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        {gameState !== 'menu' && gameState !== 'gameOver' && (
          <div className="mt-6 text-center text-slate-400 text-sm">
            <p>Click on the blocks to walk the path. Green shows your position.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryPathGame;