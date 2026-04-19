import { useEffect, useRef } from "react";
import { useGetLiveWithdrawals } from "@workspace/api-client-react";
import { toast } from "sonner";
import { BadgeDollarSign } from "lucide-react";

export default function LiveNotifications() {
  const { data: withdrawals } = useGetLiveWithdrawals({
    query: { 
      refetchInterval: 15000, // Poll every 15 seconds
      staleTime: 10000 
    }
  });
  
  // Track IDs of notifications already shown to avoid duplicates
  const shownIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!withdrawals || withdrawals.length === 0) return;

    // On first load, just populate the seen IDs so we don't spam old notifications
    if (isFirstLoad.current) {
      withdrawals.forEach(w => shownIds.current.add(w.id));
      isFirstLoad.current = false;
      return;
    }

    // Check for new withdrawals
    withdrawals.forEach((w) => {
      if (!shownIds.current.has(w.id)) {
        shownIds.current.add(w.id);
        
        // Mask username: Ali***
        const maskedName = w.username.length > 3 
          ? w.username.slice(0, 3) + "***" 
          : w.username + "***";

        // Trigger toast
        toast.success(`Withdrawal Success!`, {
          description: `${maskedName} just withdrew $${w.amount.toFixed(2)} via ${w.method.replace('_', ' ')}`,
          icon: <BadgeDollarSign className="h-5 w-5 text-green-500" />,
          duration: 5000,
        });
      }
    });
  }, [withdrawals]);

  return null; // This component handles side effects only
}
