import React from 'react';
import GameBoard from './components/GameBoard';

const App: React.FC = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 md:p-8">
      <div className="text-center mb-4">
        <h1 className="text-4xl md:text-5xl font-bold text-amber-400 tracking-wider">
          Strategic Board Game
        </h1>
        <p className="text-gray-400 mt-2">15x15 Viewport on a Wider Board</p>
      </div>
      <GameBoard />
    </main>
  );
};

export default App;
