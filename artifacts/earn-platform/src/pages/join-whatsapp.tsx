import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Bell, ShieldCheck, Check } from "lucide-react";

export default function JoinWhatsApp() {
  const WHATSAPP_LINK = "https://whatsapp.com/channel/0029Vb84gsREFeXs8p8dwo0u";

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Official Channel</h1>
        <p className="text-slate-500 dark:text-slate-400">Stay updated with the latest news, payment proofs, and announcements.</p>
      </div>

      <Card className="shadow-lg border-green-100 dark:border-green-900/20 bg-white dark:bg-slate-900/60 overflow-hidden backdrop-blur-sm">
        <div className="h-2 bg-green-500 w-full"></div>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-green-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
            <MessageCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-slate-800 dark:text-slate-100">Elite Starx WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-left">
            <div className="flex items-start gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg mt-0.5">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Instant Updates</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">New ads & rewards</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg mt-0.5">
                <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Payment Proofs</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Verified cashouts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg mt-0.5">
                <Check className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Direct Support</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Community help</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-medium">
              Elite Starx ke official WhatsApp channel ko join karein taake aap kisi bhi update se mehroom na rahein.
            </p>
            <Button 
              size="lg" 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-14 text-lg shadow-md transition-all hover:scale-[1.02]"
              onClick={() => window.open(WHATSAPP_LINK, "_blank")}
            >
              <MessageCircle className="mr-2 h-6 w-6" />
              Join Channel Now
            </Button>
          </div>

          <p className="text-[11px] text-slate-400">
            Clicking the button will open WhatsApp in a new tab.
          </p>
        </CardContent>
      </Card>

      <div className="text-center pt-4">
        <p className="text-xs text-slate-400">Official Link: {WHATSAPP_LINK}</p>
      </div>
    </div>
  );
}
