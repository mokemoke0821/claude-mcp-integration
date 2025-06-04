import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../stores/gameStore';
import { GameSettings } from '../types/GameTypes';

const SettingsScreen: React.FC = () => {
  const { startGame } = useGameStore();
  
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: 'NORMAL',
    turnLimit: 30,
    suspectType: 'CALM',
    ollamaModel: 'qwen2.5:7b',
    enableEffects: true,
    autoSave: false
  });

  const handleStartGame = () => {
    startGame(settings);
  };

  const difficultyOptions = [
    { value: 'EASY', label: 'イージー', description: '初心者向け - 容疑者が協力的' },
    { value: 'NORMAL', label: 'ノーマル', description: 'バランス型 - 標準的な難易度' },
    { value: 'HARD', label: 'ハード', description: '上級者向け - 容疑者が頑固' },
    { value: 'EXTREME', label: 'エクストリーム', description: '極限 - ほぼ自供しない' }
  ];

  const suspectTypes = [
    { value: 'CALM', label: '冷静型', icon: '😐' },
    { value: 'EMOTIONAL', label: '感情型', icon: '😰' },
    { value: 'STUBBORN', label: '頑固型', icon: '😤' },
    { value: 'CUNNING', label: '狡猾型', icon: '🦊' }
  ];

  const modelOptions = [
    { value: 'qwen2.5:7b', label: 'Qwen 2.5 7B (推奨)' },
    { value: 'llama3.2:latest', label: 'Llama 3.2' },
    { value: 'gemma2:latest', label: 'Gemma 2' },
    { value: 'mistral:latest', label: 'Mistral' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-8 max-w-2xl w-full border border-gray-700"
      >
        <h1 className="text-3xl font-bold text-center mb-8 text-red-400">
          取調室ライフバトルゲーム
        </h1>
        
        <div className="space-y-6">
          {/* 難易度選択 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">難易度</h3>
            <div className="grid grid-cols-2 gap-3">
              {difficultyOptions.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSettings({ ...settings, difficulty: option.value as any })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.difficulty === option.value
                      ? 'border-blue-500 bg-blue-900 bg-opacity-30'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{option.description}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 容疑者タイプ */}
          <div>
            <h3 className="text-lg font-semibold mb-3">容疑者タイプ</h3>
            <div className="grid grid-cols-4 gap-3">
              {suspectTypes.map((type) => (
                <motion.button
                  key={type.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSettings({ ...settings, suspectType: type.value as any })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    settings.suspectType === type.value
                      ? 'border-purple-500 bg-purple-900 bg-opacity-30'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm">{type.label}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* ターン数制限 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              ターン制限: <span className="text-yellow-400">{settings.turnLimit}</span>
            </h3>
            <input
              type="range"
              min="20"
              max="50"
              value={settings.turnLimit}
              onChange={(e) => setSettings({ ...settings, turnLimit: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>20ターン</span>
              <span>50ターン</span>
            </div>
          </div>

          {/* AIモデル選択 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">AIモデル</h3>
            <select
              value={settings.ollamaModel}
              onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
              className="w-full bg-gray-700 text-gray-100 px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              {modelOptions.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          {/* オプション */}
          <div>
            <h3 className="text-lg font-semibold mb-3">オプション</h3>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableEffects}
                  onChange={(e) => setSettings({ ...settings, enableEffects: e.target.checked })}
                  className="mr-3 w-4 h-4 text-blue-600 bg-gray-700 rounded focus:ring-blue-500"
                />
                <span>ビジュアルエフェクトを有効にする</span>
              </label>
            </div>
          </div>

          {/* ゲーム開始ボタン */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartGame}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors text-lg"
          >
            尋問開始
          </motion.button>
        </div>

        {/* ゲーム説明 */}
        <div className="mt-8 p-4 bg-gray-900 rounded-lg text-sm text-gray-400">
          <h4 className="font-semibold text-gray-300 mb-2">ゲームルール</h4>
          <ul className="space-y-1">
            <li>• 戦略的な質問で容疑者の精神力（Mental Life）を削ります</li>
            <li>• Mental Lifeが20%以下になるか、自供意欲が90%を超えると勝利</li>
            <li>• 警戒度が90%を超えるか、ターン制限に達すると敗北</li>
            <li>• 刑事スキルを適切なタイミングで使用しましょう</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsScreen;