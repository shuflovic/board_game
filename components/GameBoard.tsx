import React, { useState, useEffect, useRef } from 'react';
import { ROWS, VISIBLE_COLS, TOTAL_COLS, ROW_LABELS } from '../constants';

const PAN_AMOUNT = 5;
const initialViewportOffset = (TOTAL_COLS - VISIBLE_COLS) / 2;

const createInitialBoard = () => {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from(
      { length: TOTAL_COLS },
      // Populate checkers across the entire board width for rows 5 and below.
      (_, c) => r >= 5
    )
  );
};

const GameBoard: React.FC = () => {
  const [board, setBoard] = useState<boolean[][]>(createInitialBoard());
  const [selectedPiece, setSelectedPiece] = useState<[number, number] | null>(
    null
  );
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [history, setHistory] = useState<boolean[][][]>([]);
  const [viewportOffset, setViewportOffset] = useState(initialViewportOffset);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null
  );
  const [highestRowReached, setHighestRowReached] = useState<number>(5);
  const notificationTimeoutRef = useRef<number | null>(null);

  // Effect to clear the notification after a delay
  useEffect(() => {
    if (notificationMessage) {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      notificationTimeoutRef.current = window.setTimeout(() => {
        setNotificationMessage(null);
      }, 4000); // Display for 4 seconds
    }

    // Cleanup on unmount
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [notificationMessage]);

  const calculateValidMoves = (
    row: number,
    col: number,
    currentBoard: boolean[][]
  ): [number, number][] => {
    const moves: [number, number][] = [];
    const directions = [
      [-2, 0], // Up
      [2, 0], // Down
      [0, -2], // Left
      [0, 2], // Right
    ];

    for (const [rowOffset, colOffset] of directions) {
      const destRow = row + rowOffset;
      const destCol = col + colOffset;
      const jumpedRow = row + rowOffset / 2;
      const jumpedCol = col + colOffset / 2;

      if (
        destRow >= 0 &&
        destRow < ROWS &&
        destCol >= 0 &&
        destCol < TOTAL_COLS
      ) {
        if (
          !currentBoard[destRow][destCol] &&
          currentBoard[jumpedRow][jumpedCol]
        ) {
          moves.push([destRow, destCol]);
        }
      }
    }
    return moves;
  };

  const handleCellClick = (rowIndex: number, viewColIndex: number) => {
    const absoluteColIndex = viewColIndex + viewportOffset;
    const clickedOnPiece = board[rowIndex][absoluteColIndex];

    if (selectedPiece && !clickedOnPiece) {
      const isAValidMove = validMoves.some(
        (move) => move[0] === rowIndex && move[1] === absoluteColIndex
      );

      if (isAValidMove) {
        const [startRow, startCol] = selectedPiece;
        const jumpedRow = startRow + (rowIndex - startRow) / 2;
        const jumpedCol = startCol + (absoluteColIndex - startCol) / 2;

        setHistory([...history, board]);

        const newBoard = board.map((row) => [...row]);
        newBoard[startRow][startCol] = false;
        newBoard[jumpedRow][jumpedCol] = false;
        newBoard[rowIndex][absoluteColIndex] = true;
        setBoard(newBoard);
        setSelectedPiece(null);
        setValidMoves([]);

        // Show notification only if a new highest row is reached
        if (rowIndex < highestRowReached) {
          setHighestRowReached(rowIndex); // Set new record

          let message: string | null = null;
          switch (rowIndex) {
            case 4: // Label '1'
              message = 'Nice start! The journey has just begun.';
              break;
            case 3: // Label '2'
              message = "Making progress! You're getting the hang of this.";
              break;
            case 2: // Label '3'
              message = 'Impressive! You are a natural strategist.';
              break;
            case 1: // Label '4'
              message = 'The summit awaits! One more push to victory!';
              break;
            case 0: // Label '5' - The final row
              message = 'VICTORY! You have conquered the board!';
              break;
            default:
              break;
          }

          if (message) {
            setNotificationMessage(message);
          }
        }
        return;
      }
    }

    if (clickedOnPiece) {
      if (
        selectedPiece &&
        selectedPiece[0] === rowIndex &&
        selectedPiece[1] === absoluteColIndex
      ) {
        setSelectedPiece(null);
        setValidMoves([]);
      } else {
        setSelectedPiece([rowIndex, absoluteColIndex]);
        setValidMoves(calculateValidMoves(rowIndex, absoluteColIndex, board));
      }
    } else {
      setSelectedPiece(null);
      setValidMoves([]);
    }
  };

  const handleReset = () => {
    setBoard(createInitialBoard());
    setSelectedPiece(null);
    setValidMoves([]);
    setHistory([]);
    setViewportOffset(initialViewportOffset);
    setHighestRowReached(5);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastBoardState = history[history.length - 1];
    setBoard(lastBoardState);
    setHistory(history.slice(0, -1));
    setSelectedPiece(null);
    setValidMoves([]);
  };

  const handlePan = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setViewportOffset((prev) => Math.max(0, prev - PAN_AMOUNT));
    } else {
      setViewportOffset((prev) =>
        Math.min(TOTAL_COLS - VISIBLE_COLS, prev + PAN_AMOUNT)
      );
    }
  };

  return (
    <div className="w-full max-w-[90vh] mx-auto flex flex-col gap-4 relative">
      {/* Notification Toast */}
      {notificationMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-900 bg-opacity-90 text-amber-400 font-bold text-lg text-center p-4 rounded-xl shadow-lg border-2 border-amber-500 animate-fade-in-out"
        >
          {notificationMessage}
        </div>
      )}

      <div className="flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
        <button
          onClick={() => handlePan('left')}
          disabled={viewportOffset === 0}
          className="px-4 py-2 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
          aria-label="Pan board left"
        >
          &#9664;
        </button>
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="px-6 py-2 bg-amber-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
          aria-label="Undo last move"
        >
          Undo
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-sky-500 text-gray-900 font-semibold rounded-lg shadow-md hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 transition-colors"
          aria-label="Reset the game to the starting position"
        >
          Reset
        </button>
        <button
          onClick={() => handlePan('right')}
          disabled={viewportOffset >= TOTAL_COLS - VISIBLE_COLS}
          className="px-4 py-2 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
          aria-label="Pan board right"
        >
          &#9654;
        </button>
      </div>

      <div className="bg-gray-800 p-2 sm:p-4 rounded-xl shadow-2xl border-2 border-gray-700 w-full aspect-[15/20]">
        <div
          className="grid h-full w-full items-center gap-px bg-gray-500"
          style={{
            gridTemplateColumns: `minmax(2rem, auto) repeat(${VISIBLE_COLS}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: ROWS }).map((_, rowIndex) => (
            <React.Fragment key={`row-${rowIndex}`}>
              <div className="flex items-center justify-center text-sm sm:text-base font-semibold text-gray-400 w-8 sm:w-10 bg-gray-800">
                {ROW_LABELS[rowIndex]}
              </div>
              {Array.from({ length: VISIBLE_COLS }).map((_, viewColIndex) => {
                const absoluteColIndex = viewColIndex + viewportOffset;
                const isTopRow = rowIndex === 0;
                const bgColor = isTopRow ? 'bg-sky-200' : 'bg-stone-300';
                const ringOffsetColor = isTopRow
                  ? 'ring-offset-sky-200'
                  : 'ring-offset-stone-300';

                const hasPiece = board[rowIndex][absoluteColIndex];
                const isSelected =
                  selectedPiece &&
                  selectedPiece[0] === rowIndex &&
                  selectedPiece[1] === absoluteColIndex;
                const isAValidMove = validMoves.some(
                  (move) => move[0] === rowIndex && move[1] === absoluteColIndex
                );

                return (
                  <div
                    key={`${rowIndex}-${absoluteColIndex}`}
                    onClick={() => handleCellClick(rowIndex, viewColIndex)}
                    className={`aspect-square w-full ${bgColor} transition-transform duration-150 flex items-center justify-center p-0.5 sm:p-1.5 ${
                      hasPiece || isAValidMove
                        ? 'cursor-pointer'
                        : 'cursor-default'
                    } hover:scale-105 hover:z-10`}
                  >
                    {hasPiece && (
                      <div
                        className={`w-full h-full bg-black rounded-full shadow-lg transition-all duration-150 ${
                          isSelected
                            ? `ring-4 ring-offset-2 ${ringOffsetColor} ring-amber-400`
                            : ''
                        }`}
                        aria-label="Game Piece"
                      />
                    )}
                    {!hasPiece && isAValidMove && (
                      <div
                        className="w-1/2 h-1/2 bg-amber-400/50 rounded-full animate-pulse"
                        aria-label="Valid move indicator"
                      />
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
