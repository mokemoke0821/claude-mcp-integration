import useGameStore from './stores/gameStore';
import GameInterface from './ui/GameInterface';
import ResultsScreen from './ui/ResultsScreen';
import SettingsScreen from './ui/SettingsScreen';

function App() {
  const { gameActive, showResults } = useGameStore();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* 背景エフェクト */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-50" />

      {/* メインコンテンツ */}
      <div className="relative z-10">
        {showResults ? (
          <ResultsScreen />
        ) : gameActive ? (
          <GameInterface />
        ) : (
          <SettingsScreen />
        )}
      </div>
    </div>
  );
}

export default App;