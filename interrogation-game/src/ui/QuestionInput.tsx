import React, { useState, KeyboardEvent, useRef } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../stores/gameStore';

const QuestionInput: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { askQuestion, isProcessing, availableSkills, useSkill } = useGameStore();

  const handleSubmit = async () => {
    if (!question.trim() || isProcessing) return;
    
    // スキルを使用する場合
    if (selectedSkill) {
      useSkill(selectedSkill);
    }
    
    // 質問を送信
    await askQuestion(question.trim());
    setQuestion('');
    setSelectedSkill(null);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 質問の例
  const questionExamples = [
    { text: "その時間、どこにいましたか？", type: "logical" },
    { text: "被害者とはどういう関係でしたか？", type: "logical" },
    { text: "やったのはあなたですね？", type: "direct" },
    { text: "家族のことを考えてください", type: "emotional" },
    { text: "大丈夫ですか？水でも飲みますか？", type: "gentle" }
  ];

  const selectExample = (example: string) => {
    setQuestion(example);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2 text-gray-300">質問入力</h3>
        
        {/* スキル選択表示 */}
        {selectedSkill && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 p-2 bg-blue-900 bg-opacity-50 rounded-lg text-sm text-blue-300"
          >
            スキル準備中: {availableSkills.find(s => s.id === selectedSkill)?.name}
          </motion.div>
        )}
        
        {/* 入力フィールド */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="容疑者への質問を入力..."
            disabled={isProcessing}
            className="flex-1 bg-gray-900 text-gray-100 px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
          />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!question.trim() || isProcessing}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              !question.trim() || isProcessing
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                送信中...
              </span>
            ) : (
              '質問する'
            )}
          </motion.button>
        </div>
      </div>
      
      {/* 質問例 */}
      <div className="mt-4">
        <p className="text-sm text-gray-400 mb-2">質問例：</p>
        <div className="flex flex-wrap gap-2">
          {questionExamples.map((example, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => selectExample(example.text)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
            >
              {example.text}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* 質問タイプのヒント */}
      <div className="mt-4 p-3 bg-gray-900 rounded-lg text-xs text-gray-400">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-red-400">⚔️ 直接的</span>: 大ダメージ、警戒度UP
          </div>
          <div>
            <span className="text-purple-400">🧠 心理的</span>: 自供率UP
          </div>
          <div>
            <span className="text-blue-400">📊 論理的</span>: バランス型
          </div>
          <div>
            <span className="text-green-400">💝 優しい</span>: 信頼度UP
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionInput;