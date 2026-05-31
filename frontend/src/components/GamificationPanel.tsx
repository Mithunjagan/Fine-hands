import React from 'react';
import { useGamificationStore } from '../store/gamificationStore';
import { Trophy, Star, Medal, CheckCircle2 } from 'lucide-react';

export const GamificationPanel: React.FC = () => {
  const { xp, level, nextLevelXp, quests, badges } = useGamificationStore();
  
  const progressPercent = (xp / nextLevelXp) * 100;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Progress
          </h3>
          <p className="text-sm text-gray-400">Level up your financial habits</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-2xl font-bold text-white flex items-baseline gap-1">
            <span className="text-sm text-gray-400 font-normal">Lvl</span> {level}
          </div>
        </div>
      </div>

      {/* Level Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-1 font-medium">
          <span className="text-yellow-500">{xp} XP</span>
          <span className="text-gray-500">{nextLevelXp} XP</span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-800 p-0.5 overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-1000 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* Active Quests */}
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-blue-400" /> Active Quests
          </h4>
          <div className="space-y-3">
            {quests.map(quest => (
              <div key={quest.id} className="rounded-xl border border-gray-800 bg-gray-950/50 p-3">
                <div className="flex justify-between mb-2">
                  <div className="flex gap-2 items-center">
                    <span className="text-lg">{quest.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{quest.title}</div>
                      <div className="text-xs text-gray-500">{quest.description}</div>
                    </div>
                  </div>
                  {quest.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md h-fit">+{quest.xp} XP</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-gray-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${quest.completed ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 w-8 text-right">
                    {quest.progress}/{quest.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badge Gallery */}
        {badges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <Medal className="h-4 w-4 text-purple-400" /> Earned Badges
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {badges.map(badge => (
                <div key={badge.id} className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-800/30 border border-gray-700/50" title={badge.description}>
                  <span className="text-2xl mb-1">{badge.icon}</span>
                  <span className="text-[10px] text-gray-300 text-center leading-tight truncate w-full">{badge.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
