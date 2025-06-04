import React from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../stores/gameStore';
import { GamePhase } from '../types/GameTypes';

const StatusDisplay: React.FC = () => {
  const { suspect, suspectStatus, currentPhase, interrogationPoints } = useGameStore();

  if (!suspect) return null;

  const getPhaseColor = (phase: GamePhase) => {
    switch (phase) {
      case GamePhase.PHASE1_CONFIDENT: return 'text-green-400';
      case GamePhase.PHASE2_NERVOUS: return 'text-yellow-400';
      case GamePhase.PHASE3_CONFUSED: return 'text-orange-400';
      case GamePhase.PHASE4_BREAKDOWN: return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPhaseText = (phase: GamePhase) => {
    switch (phase) {
      case GamePhase.PHASE1_CONFIDENT: return '余裕期';
      case GamePhase.PHASE2_NERVOUS: return '動揺期';
      case GamePhase.PHASE3_CONFUSED: return '混乱期';
      case GamePhase.PHASE4_BREAKDOWN: return '崩壊期';
      default: return '不明';
    }
  };

  const StatusBar = ({ label, value, maxValue, color, icon }: {
    label: string;
    value: number;
    maxValue: number;
    color: string;
    icon: string;
  }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-400 flex items-center gap-1">
          <span>{icon}</span>
          {label}
        </span>
        <span className="text-sm font-bold">{value}/{maxValue}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <motion.div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${(value / maxValue) * 100}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${(value / maxValue) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* 容疑者情報 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">{suspect.name}</h2>
        <p className="text-sm text-gray-400">
          {suspect.age}歳 / {suspect.occupation}
        </p>
        <p className="text-sm text-red-400 mt-1">
          容疑: {suspect.crime}
        </p>
      </div>

      {/* フェーズ表示 */}
      <div className={`text-center mb-6 p-3 rounded-lg bg-gray-900 border ${getPhaseColor(currentPhase)} border-current`}>
        <div className={`text-lg font-bold ${getPhaseColor(currentPhase)}`}>
          {getPhaseText(currentPhase)}
        </div>
      </div>

      {/* ステータスバー */}
      <StatusBar
        label="Mental Life"
        value={suspectStatus.mentalLife}
        maxValue={100}
        color={suspectStatus.mentalLife < 30 ? 'bg-red-500' : suspectStatus.mentalLife < 60 ? 'bg-yellow-500' : 'bg-green-500'}
        icon="❤️"
      />
      
      <StatusBar
        label="警戒度"
        value={suspectStatus.alertLevel}
        maxValue={100}
        color="bg-orange-500"
        icon="⚠️"
      />
      
      <StatusBar
        label="信頼度"
        value={suspectStatus.trustLevel}
        maxValue={100}
        color="bg-blue-500"
        icon="🤝"
      />
      
      <StatusBar
        label="自供意欲"
        value={suspectStatus.confessionRate}
        maxValue={100}
        color="bg-purple-500"
        icon="💭"
      />

      {/* プレイヤーステータス */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <StatusBar
          label="尋問ポイント"
          value={interrogationPoints}
          maxValue={100}
          color="bg-cyan-500"
          icon="💪"
        />
      </div>

      {/* 警告表示 */}
      {suspectStatus.alertLevel > 70 && (
        <motion.div
          className="mt-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg text-red-300 text-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          ⚠️ 警戒度が高い！弁護士を呼ばれる可能性があります
        </motion.div>
      )}
      
      {suspectStatus.mentalLife < 30 && (
        <motion.div
          className="mt-4 p-3 bg-green-900 bg-opacity-50 border border-green-500 rounded-lg text-green-300 text-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          ✨ 自供が近い！もう少しで真実が明らかに...
        </motion.div>
      )}
    </div>
  );
};

export default StatusDisplay;