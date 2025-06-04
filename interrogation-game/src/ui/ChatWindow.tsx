import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef } from 'react';
import useGameStore from '../stores/gameStore';

const ChatWindow: React.FC = () => {
  const { conversationHistory, logs, isProcessing } = useGameStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, logs]);

  const renderMessage = (entry: { role: 'player' | 'suspect'; message: string }, index: number) => {
    const isPlayer = entry.role === 'player';

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={`flex ${isPlayer ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[70%] ${isPlayer ? 'order-2' : 'order-1'}`}>
          <div className={`px-4 py-3 rounded-lg ${isPlayer
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-100'
            }`}>
            <div className="text-xs text-gray-300 mb-1">
              {isPlayer ? '刑事' : '容疑者'}
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {entry.message}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderLog = (log: any, index: number) => {
    let bgColor = 'bg-gray-800';
    let textColor = 'text-gray-400';
    let icon = '📝';

    switch (log.type) {
      case 'damage':
        bgColor = 'bg-red-900 bg-opacity-30';
        textColor = 'text-red-400';
        icon = '⚔️';
        break;
      case 'skill':
        bgColor = 'bg-blue-900 bg-opacity-30';
        textColor = 'text-blue-400';
        icon = '✨';
        break;
      case 'counter':
        bgColor = 'bg-orange-900 bg-opacity-30';
        textColor = 'text-orange-400';
        icon = '🛡️';
        break;
      case 'phase_change':
        bgColor = 'bg-purple-900 bg-opacity-30';
        textColor = 'text-purple-400';
        icon = '🔄';
        break;
      case 'system':
        bgColor = 'bg-green-900 bg-opacity-30';
        textColor = 'text-green-400';
        icon = '💡';
        break;
    }

    return (
      <motion.div
        key={`log-${index}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className={`mb-2 px-3 py-2 rounded ${bgColor} ${textColor} text-xs`}
      >
        <span className="mr-2">{icon}</span>
        {log.message}
      </motion.div>
    );
  };

  // 会話とログを統合して時系列順に表示
  const combinedContent = [];
  let logIndex = 0;

  // 簡易的な統合（実際にはタイムスタンプで正確にソートすべき）
  conversationHistory.forEach((entry, index) => {
    combinedContent.push({ type: 'message', data: entry, index });

    // 関連するログを挿入
    while (logIndex < logs.length && logIndex <= index * 2) {
      combinedContent.push({ type: 'log', data: logs[logIndex], index: logIndex });
      logIndex++;
    }
  });

  // 残りのログを追加
  while (logIndex < logs.length) {
    combinedContent.push({ type: 'log', data: logs[logIndex], index: logIndex });
    logIndex++;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 h-full flex flex-col border border-gray-700">
      <h3 className="text-lg font-bold mb-4 text-gray-300">尋問記録</h3>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence>
          {combinedContent.map((item, _idx) => (
            item.type === 'message'
              ? renderMessage(item.data as any, item.index)
              : renderLog(item.data, item.index)
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-4"
          >
            <div className="bg-gray-700 px-4 py-3 rounded-lg">
              <div className="flex space-x-2">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;