import React from 'react';
import { motion } from 'framer-motion';
import StatusDisplay from './StatusDisplay';
import ChatWindow from './ChatWindow';
import SkillButtons from './SkillButtons';
import QuestionInput from './QuestionInput';
import useGameStore from '../stores/gameStore';

const GameInterface: React.FC = () => {
  const { 
    currentAnimation, 
    damageNumbers,
    currentTurn,
    maxTurns
  } = useGameStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-400">取調室ライフバトル</h1>
          <div className="text-lg">
            ターン: <span className="text-yellow-400 font-bold">{currentTurn}</span> / {maxTurns}
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* 左側：ステータス表示 */}
        <aside className="w-1/3">
          <StatusDisplay />
          <div className="mt-6">
            <SkillButtons />
          </div>
        </aside>

        {/* 右側：チャットウィンドウ */}
        <section className="flex-1 flex flex-col">
          <motion.div
            className={`flex-1 relative ${currentAnimation?.type === 'shake' ? 'animate-shake' : ''}`}
            animate={currentAnimation?.type === 'flash' ? {
              backgroundColor: ['transparent', currentAnimation.color || '#ff0000', 'transparent']
            } : {}}
            transition={{ duration: 0.3 }}
          >
            <ChatWindow />
            
            {/* ダメージ数値表示 */}
            {damageNumbers.map(({ id, value, x, y }) => (
              <motion.div
                key={id}
                className="absolute pointer-events-none"
                style={{ left: `${x}%`, top: `${y}%` }}
                initial={{ opacity: 1, scale: 1, y: 0 }}
                animate={{ opacity: 0, scale: 1.5, y: -60 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
              >
                <span className={`text-4xl font-bold ${value >= 30 ? 'text-red-500' : value >= 15 ? 'text-yellow-500' : 'text-gray-400'}`}>
                  -{value}
                </span>
              </motion.div>
            ))}
          </motion.div>
          
          <div className="mt-4">
            <QuestionInput />
          </div>
        </section>
      </main>
    </div>
  );
};

export default GameInterface;