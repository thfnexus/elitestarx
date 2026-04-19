import { User } from "@workspace/db/schema";
import { Hexagon, Sparkles } from "lucide-react";
import { Progress } from "./ui/progress";

interface PremiumCardProps {
  user: User;
  onAvatarClick?: () => void;
}

export function PremiumCard({ user, onAvatarClick }: PremiumCardProps) {
  const currentLevel = (user as any).level || 0;
  const rawXp = (user as any).xp || 0;
  const xpToNextLevel = 100; // Every 100 XP grants 1 Level
  const currentXp = rawXp % xpToNextLevel;
  const progress = (currentXp / xpToNextLevel) * 100;

  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] p-[2px] shadow-2xl transition-all hover:scale-[1.02] duration-500">
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-none" />
      
      <div className="relative h-full w-full rounded-[2.4rem] bg-[#1a0b2e]/90 backdrop-blur-xl p-6 sm:p-8 flex items-center gap-6 border border-white/10">
        
        {/* Avatar Section with Glowing Ring */}
        <div className="relative group cursor-pointer" onClick={onAvatarClick}>
          {/* Animated Glow Rings */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400 opacity-75 blur-md group-hover:opacity-100 animate-pulse transition-opacity" />
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-amber-400 to-cyan-400" />
          
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-[#1a0b2e] bg-slate-800 overflow-hidden shadow-inner ring-1 ring-white/20">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.username} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-3xl font-black text-white/50">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Upload Overlay on Hover */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-[10px] font-black text-white uppercase tracking-tighter">Change</span>
            </div>
          </div>
        </div>

        {/* User Info Section */}
        <div className="flex-1 space-y-3">
          <div className="space-y-0.5 mt-[-4px]">
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
              {user.username}
            </h3>
            <div className="flex items-center gap-2">
               <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-amber-400 uppercase tracking-widest shadow-sm">
                 Elite Member
               </span>
               {user.isAdmin && (
                 <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-500 uppercase tracking-widest shadow-sm">
                   Admin
                 </span>
               )}
            </div>
          </div>

          {/* Level & Progress */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-end text-[11px] font-black text-white/70 uppercase tracking-widest">
               <span className="flex items-center gap-1.5">
                 Level <span className="text-white text-sm">{currentLevel}</span>
               </span>
               <span className="text-[9px] opacity-60">{currentXp}/{xpToNextLevel} XP</span>
            </div>
            
            <div className="relative h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
               <div 
                 className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                 style={{ width: `${progress}%` }} 
               />
               {/* Shine effect on bar */}
               <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent translate-y-[-50%]" />
            </div>
          </div>
        </div>

        {/* Decorative Hexagon Badge */}
        <div className="hidden sm:block opacity-40 hover:opacity-100 transition-all duration-500 hover:rotate-[30deg]">
          <div className="relative">
            <Hexagon className="h-14 w-14 text-white fill-white/10 filter blur-[0.5px]" strokeWidth={1} />
            <Sparkles className="absolute inset-0 h-6 w-6 m-auto text-amber-400 animate-pulse" />
          </div>
        </div>

      </div>

      {/* Subtle Bottom Light */}
      <div className="absolute bottom-[-20%] left-[20%] right-[20%] h-12 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none" />
    </div>
  );
}
