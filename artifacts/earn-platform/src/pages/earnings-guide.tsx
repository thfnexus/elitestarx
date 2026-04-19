import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Info, TrendingUp, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function EarningsGuide() {
  const levels = [
    { level: 1, type: "Direct Referrals", commission: 0.54, description: "Friends you invite using your link." },
    { level: 2, type: "Secondary Referrals", commission: 0.29, description: "Friends invited by your Level 1 members." },
    { level: 3, type: "Tier 3 Referrals", commission: 0.14, description: "Friends invited by your Level 2 members." },
    { level: 4, type: "Tier 4 Referrals", commission: 0.07, description: "Friends invited by your Level 3 members." },
    { level: 5, type: "Tier 5 Referrals", commission: 0.04, description: "Friends invited by your Level 4 members." },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">Earnings Guide</h1>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Learn how you earn passive income through your team levels. Increase ads watch earning with increase working progress</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-blue-600 dark:text-blue-400 flex items-center gap-2 uppercase tracking-wider">
              <Users className="h-4 w-4" />
              Network Power
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-50">5 Levels</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Earn from a wide network</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
              <DollarSign className="h-4 w-4" />
              Initial Reward
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-50">$0.54</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">For every direct signup</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-purple-600 dark:text-purple-400 flex items-center gap-2 uppercase tracking-wider">
              <TrendingUp className="h-4 w-4" />
              Passive Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-50">Automation</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Earn as your team grows</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 font-black text-slate-900 dark:text-slate-50">
            <Info className="h-5 w-5 text-primary" />
            Commission Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30 dark:bg-slate-900/40">
              <TableRow className="border-slate-200 dark:border-slate-800">
                <TableHead className="w-[100px] font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400">Level</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400">Type</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400">Commission</TableHead>
                <TableHead className="hidden md:table-cell font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map((l) => (
                <TableRow key={l.level} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-black text-primary">Level {l.level}</TableCell>
                  <TableCell className="font-bold text-slate-900 dark:text-slate-200">{l.type}</TableCell>
                  <TableCell className="text-emerald-600 dark:text-emerald-400 font-black">${l.commission.toFixed(2)}</TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400 text-sm font-medium hidden md:table-cell">{l.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="m-6 p-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl border border-dashed border-blue-200 dark:border-blue-900/40">
            <h4 className="font-black text-slate-900 dark:text-slate-50 flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              How it works (Urdu/Hindi)
            </h4>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-4 font-medium leading-relaxed">
              <p>• <strong className="text-slate-950 dark:text-white font-black">Level 1</strong> mein woh log aatay hain jo aapke link se direct join kartay hain.</p>
              <p>• <strong className="text-slate-950 dark:text-white font-black">Level 2 se Level 5</strong> tak aapko passive income milti hai. Iska matlab hai ke agar aapka koi team member aage kisi ko join karwaye, toh uska faida aapko bhi hoga.</p>
              <p>• Aapki team jitni bari hogi, aapki monthly passive income utni hi zyada hogi baghair kisi extra mehnat ke.</p>
            </div>
          </div>

          <div className="m-6 mt-0 p-6 bg-amber-50/30 dark:bg-amber-900/10 rounded-3xl border border-dashed border-amber-200 dark:border-amber-900/40">
            <h4 className="font-black text-amber-900 dark:text-amber-200 flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-amber-500" />
              Weekly Pool Bonus (Extra Reward)
            </h4>
            <div className="text-sm text-amber-800 dark:text-amber-400 space-y-4 font-medium leading-relaxed">
              <p>• Har referral par aapko direct commission ke ilawa <strong className="text-amber-950 dark:text-white font-black">$0.18</strong> ka extra weekly pool bonus bhi milta hai.</p>
              <p>• Yeh bonus poray hafte ki performance par calculate hota hai aur har <strong className="text-amber-950 dark:text-white font-black">Sunday raat 12 baje</strong> aapke balance mein auto-add ho jata hai.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

