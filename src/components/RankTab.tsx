import React from 'react';
import { Trophy, Gift, Clock, Flame, Crown, Medal } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { LEADERBOARD_USERS } from '../data';
import { TRANSLATIONS } from '../i18n';

interface RankTabProps {
  user: UserProfile;
  language: Language;
  onOpenMegaContest: () => void;
}

export const RankTab: React.FC<RankTabProps> = ({
  user,
  language,
  onOpenMegaContest,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [timeFilter, setTimeFilter] = React.useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Daily');
  const [rankCategory, setRankCategory] = React.useState<'refs' | 'earners' | 'unlocks'>('refs');
  const [countdown, setCountdown] = React.useState('00:02:06');

  // Live countdown
  React.useEffect(() => {
    let secs = 126;
    const interval = setInterval(() => {
      secs = secs <= 0 ? 126 : secs - 1;
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setCountdown(`00:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="rank-tab-content" className="space-y-4 pb-20 pt-2">
      {/* Top Champions Card */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-purple-700 to-indigo-900 p-5 text-white shadow-xl border border-amber-300/40 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/30 rounded-full blur-2xl" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-300 fill-amber-400" />
            <span className="text-xl font-black tracking-tight">{t.topChampions}</span>
          </div>
          <button
            onClick={onOpenMegaContest}
            className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs animate-bounce"
          >
            <Flame className="w-3 h-3 fill-white" />
            CONTEST
          </button>
        </div>

        <p className="text-xs text-amber-100 font-semibold mb-3">
          STAY AHEAD AND EARN MORE!
        </p>

        {/* Tap to see rank button */}
        <button
          onClick={onOpenMegaContest}
          className="w-full py-2.5 px-3 bg-purple-950/70 hover:bg-purple-950/90 border border-amber-400/40 rounded-2xl text-xs font-black text-amber-300 flex items-center justify-center gap-2 mb-3 shadow-inner"
        >
          <Gift className="w-4 h-4 text-amber-400" />
          <span>★ TAP TO SEE YOUR RANK!</span>
        </button>

        {/* Prize & Timer Bar */}
        <div className="bg-purple-950/90 border border-purple-400/30 rounded-2xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-extrabold text-white">PRIZE: $3.00</span>
          </div>
          <div className="flex items-center gap-1 text-amber-300 font-mono font-extrabold">
            <Clock className="w-3.5 h-3.5" />
            <span>ENDS IN: {countdown}</span>
          </div>
        </div>
      </div>

      {/* Time Filter Pills: Daily, Weekly, Monthly, Yearly */}
      <div className="flex items-center justify-between bg-slate-200/80 p-1 rounded-2xl">
        {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setTimeFilter(period)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              timeFilter === period
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Category Tabs: Top Refs, Top Earners, Top Unlocks */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setRankCategory('refs')}
          className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all border ${
            rankCategory === 'refs'
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          👥 Top Refs
        </button>
        <button
          onClick={() => setRankCategory('earners')}
          className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all border ${
            rankCategory === 'earners'
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          💰 Top Earners
        </button>
        <button
          onClick={() => setRankCategory('unlocks')}
          className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all border ${
            rankCategory === 'unlocks'
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          🎥 Top Unlocks
        </button>
      </div>

      {/* Leaderboard Table List */}
      <div className="bg-white rounded-3xl p-3 shadow-xs border border-slate-200 divide-y divide-slate-100">
        {LEADERBOARD_USERS.map((item) => {
          const isTop3 = item.rank <= 3;

          return (
            <div
              key={item.rank}
              className="py-3 px-2 flex items-center justify-between hover:bg-purple-50/50 rounded-xl transition-colors"
            >
              {/* Rank & User Info */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                    item.rank === 1
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40'
                      : item.rank === 2
                      ? 'bg-slate-300 text-slate-900'
                      : item.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.rank === 1 ? '👑' : item.rank}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-slate-900">
                      {item.name}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.2 rounded">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-purple-600 font-semibold">
                    {item.bonus}
                  </div>
                </div>
              </div>

              {/* Stats Value */}
              <div className="text-right">
                <div className="font-black text-xs text-slate-900">
                  {rankCategory === 'refs'
                    ? `${item.statValue} ${item.statLabel}`
                    : rankCategory === 'earners'
                    ? `$${(parseFloat(item.statValue || '1') * 1.5 + 4.2).toFixed(2)}`
                    : `${item.bonus}`}
                </div>
                <div className="text-[10px] text-slate-400">
                  {item.rank === 1 ? '🥇 Winner' : item.rank === 2 ? '🥈 2nd Place' : item.rank === 3 ? '🥉 3rd Place' : 'Contender'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
