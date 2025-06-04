import React from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../stores/gameStore';

const SkillButtons: React.FC = () => {
  const { availableSkills, useSkill } = useGameStore();

  const getSkillButtonClass = (skill: any) => {
    const isDisabled = skill.currentUses >= skill.maxUses || skill.currentCooldown > 0;
    
    if (isDisabled) {
      return 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50';
    }
    
    switch (skill.id) {
      case 'psycho_pressure':
        return 'bg-purple-600 hover:bg-purple-700 text-white';
      case 'kind_approach':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'evidence_slam':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'read_mind':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-bold mb-4 text-gray-300">刑事スキル</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {availableSkills.map((skill) => {
          const isDisabled = skill.currentUses >= skill.maxUses || skill.currentCooldown > 0;
          
          return (
            <motion.button
              key={skill.id}
              whileHover={!isDisabled ? { scale: 1.05 } : {}}
              whileTap={!isDisabled ? { scale: 0.95 } : {}}
              className={`p-3 rounded-lg transition-colors duration-200 ${getSkillButtonClass(skill)}`}
              onClick={() => !isDisabled && useSkill(skill.id)}
              disabled={isDisabled}
            >
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">{skill.icon}</span>
                <span className="text-sm font-medium">{skill.name}</span>
                
                {/* 使用回数表示 */}
                <div className="mt-2 text-xs">
                  {skill.currentUses}/{skill.maxUses} 回
                </div>
                
                {/* クールダウン表示 */}
                {skill.currentCooldown > 0 && (
                  <div className="mt-1 text-xs text-yellow-400">
                    CD: {skill.currentCooldown}ターン
                  </div>
                )}
              </div>
              
              {/* ツールチップ（ホバー時表示） */}
              <motion.div
                className="absolute z-10 bg-gray-900 text-white p-3 rounded-lg shadow-lg text-sm w-64 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200"
                style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)' }}
              >
                <div className="font-bold mb-1">{skill.name}</div>
                <div className="text-xs text-gray-300 mb-2">{skill.description}</div>
                <div className="text-xs text-yellow-400">{skill.effect}</div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
      
      {/* スキル説明 */}
      <div className="mt-4 p-3 bg-gray-900 rounded-lg text-xs text-gray-400">
        <p>💡 ヒント: スキルは戦略的に使用しましょう。</p>
        <p className="mt-1">証拠叩きつけは最後の決め手に！</p>
      </div>
    </div>
  );
};

export default SkillButtons;