import React from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../stores/gameStore';
import { GameResult } from '../types/GameTypes';

const ResultsScreen: React.FC = () => {
  const { 
    gameResult, 
    currentTurn, 
    suspectStatus, 
    suspect,
    conversationHistory,
    resetGame 
  } = useGameStore();

  const getResultData = (result: GameResult | null) => {
    switch (result) {
      case GameResult.PERFECT_VICTORY:
        return {
          title: '完全勝利！',
          subtitle: '見事な尋問でした！',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900',
          icon: '🏆',
          score: 'S'
        };
      case GameResult.VICTORY:
        return {
          title: '勝利！',
          subtitle: '容疑者は自供しました',
          color: 'text-green-400',
          bgColor: 'bg-green-900',
          icon: '✅',
          score: 'A'
        };
      case GameResult.DRAW:
        return {
          title: '引き分け',
          subtitle: 'もう少しで自供させられました',
          color: 'text-gray-400',
          bgColor: 'bg-gray-700',
          icon: '🤝',
          score: 'B'
        };
      case GameResult.DEFEAT:
        return {
          title: '敗北...',
          subtitle: '容疑者は口を閉ざしました',
          color: 'text-red-400',
          bgColor: 'bg-red-900',
          icon: '❌',
          score: 'C'
        };
      default:
        return {
          title: 'ゲーム終了',
          subtitle: '',
          color: 'text-gray-400',
          bgColor: 'bg-gray-700',
          icon: '🎮',
          score: '-'
        };
    }
  };

  const resultData = getResultData(gameResult);

  // 統計計算
  const totalQuestions = conversationHistory.filter(c => c.role === 'player').length;
  const damageDealt = 100 - suspectStatus.mentalLife;
  const efficiency = totalQuestions > 0 ? Math.round(damageDealt / totalQuestions * 10) / 10 : 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-xl p-8 max-w-2xl w-full border border-gray-700"
      >
        {/* 結果表示 */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-6xl mb-4"
          >
            {resultData.icon}
          </motion.div>
          
          <h1 className={`text-4xl font-bold mb-2 ${resultData.color}`}>
            {resultData.title}
          </h1>
          
          <p className="text-lg text-gray-400">{resultData.subtitle}</p>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className={`inline-block mt-4 px-6 py-3 ${resultData.bgColor} bg-opacity-30 rounded-lg`}
          >
            <span className="text-2xl font-bold">ランク: {resultData.score}</span>
          </motion.div>
        </motion.div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900 p-4 rounded-lg"
          >
            <div className="text-sm text-gray-400">使用ターン数</div>
            <div className="text-2xl font-bold text-yellow-400">{currentTurn}</div>
          </motion.div>
          
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-900 p-4 rounded-lg"
          >
            <div className="text-sm text-gray-400">与えたダメージ</div>
            <div className="text-2xl font-bold text-red-400">{damageDealt}</div>
          </motion.div>
          
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-900 p-4 rounded-lg"
          >
            <div className="text-sm text-gray-400">質問回数</div>
            <div className="text-2xl font-bold text-blue-400">{totalQuestions}</div>
          </motion.div>
          
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-900 p-4 rounded-lg"
          >
            <div className="text-sm text-gray-400">効率性</div>
            <div className="text-2xl font-bold text-green-400">{efficiency}</div>
          </motion.div>
        </div>

        {/* 容疑者情報 */}
        {suspect && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-900 p-4 rounded-lg mb-8"
          >
            <h3 className="text-lg font-semibold mb-2">容疑者情報</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">名前:</span> {suspect.name}
              </div>
              <div>
                <span className="text-gray-400">年齢:</span> {suspect.age}歳
              </div>
              <div>
                <span className="text-gray-400">職業:</span> {suspect.occupation}
              </div>
              <div>
                <span className="text-gray-400">容疑:</span> {suspect.crime}
              </div>
            </div>
            
            {gameResult === GameResult.VICTORY || gameResult === GameResult.PERFECT_VICTORY ? (
              <div className="mt-4 p-3 bg-green-900 bg-opacity-30 rounded-lg">
                <p className="text-sm text-green-400">
                  動機: {suspect.motive}
                </p>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* 最終ステータス */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-gray-900 p-4 rounded-lg mb-8"
        >
          <h3 className="text-lg font-semibold mb-3">最終ステータス</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Mental Life</span>
              <span className="text-sm font-bold">{suspectStatus.mentalLife}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${suspectStatus.mentalLife}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-400">自供意欲</span>
              <span className="text-sm font-bold">{suspectStatus.confessionRate}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${suspectStatus.confessionRate}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* アクションボタン */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
            className="py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            タイトルに戻る
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // リトライ機能（同じ設定で再開）
              window.location.reload();
            }}
            className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            もう一度挑戦
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ResultsScreen;