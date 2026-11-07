import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "react-router-dom";

function spiralIndices(cols, rows) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  let top = 0, bottom = rows - 1, left = 0, right = cols - 1, i = 0;
  while (top <= bottom && left <= right) {
    for (let x = left; x <= right; x++) grid[top][x] = i++;
    top++;
    for (let y = top; y <= bottom; y++) grid[y][right] = i++;
    right--;
    if (top <= bottom) {
      for (let x = right; x >= left; x--) grid[bottom][x] = i++;
      bottom--;
    }
    if (left <= right) {
      for (let y = bottom; y >= top; y--) grid[y][left] = i++;
      left--;
    }
  }
  return grid;
}

const GridPixelateWipe = ({ children }) => {
  const location = useLocation();
  const cols = 12;
  const rows = 8;
  const pattern = "spiral"; // User's preference from the code

  const delays = useMemo(() => {
    const raw = Array.from({ length: rows }, () => Array(cols).fill(0));
    const spiral = pattern === "spiral" ? spiralIndices(cols, rows) : null;
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (pattern === "wave") {
          raw[y][x] = Math.hypot(x - (cols - 1) / 2, y - (rows - 1) / 2);
        } else if (pattern === "diagonal") {
          raw[y][x] = x + y;
        } else if (spiral) {
          raw[y][x] = spiral[y][x];
        }
      }
    }

    let min = Infinity, max = -Infinity;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (raw[y][x] < min) min = raw[y][x];
        if (raw[y][x] > max) max = raw[y][x];
      }
    }

    const range = max - min || 1;
    const normalized = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        normalized[y][x] = (raw[y][x] - min) / range;
      }
    }
    return normalized;
  }, [cols, rows, pattern]);

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", overflow: "hidden" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ position: "relative", width: "100%" }}
        >
          {children}

          {/* Transition Overlay Grid - Skip for Home */}
          {location.pathname !== "/" && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
              style={{
                position: "fixed",
                inset: 0,
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                zIndex: 9999,
                pointerEvents: "none"
              }}
            >
              {Array.from({ length: rows * cols }).map((_, i) => {
                const x = i % cols;
                const y = Math.floor(i / cols);
                const delay = delays[y][x] * 0.5; // Scale delay for speed
                
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ 
                      scale: 0, 
                      opacity: 0,
                      transition: { 
                        delay: delay, 
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1] 
                      } 
                    }}
                    exit={{ 
                      scale: 1, 
                      opacity: 1,
                      transition: { 
                        delay: delay, 
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1] 
                      } 
                    }}
                    style={{
                      background: "#0A0A0A",
                      border: "0.5px solid rgba(255,106,0,0.05)"
                    }}
                  />
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GridPixelateWipe;
