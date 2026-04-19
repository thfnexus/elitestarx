import { useEffect, useRef } from "react";
import { useGetLiveWithdrawals } from "@workspace/api-client-react";
import { toast } from "sonner";
import { BadgeDollarSign } from "lucide-react";

export default function LiveNotifications() {
  const { data: withdrawals } = useGetLiveWithdrawals({
    query: {
      refetchInterval: 15000,
      staleTime: 10000,
    } as any
  });

  // Track IDs of notifications already shown to avoid duplicates
  const shownIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!withdrawals || withdrawals.length === 0) return;

    // On first load, just populate the seen IDs so we don't spam old notifications
    if (isFirstLoad.current) {
      withdrawals.forEach(w => shownIds.current.add(String(w.id)));
      isFirstLoad.current = false;
      return;
    }

    // Check for new withdrawals
    withdrawals.forEach((w) => {
      const wId = String(w.id);
      if (!shownIds.current.has(wId)) {
        shownIds.current.add(wId);

        // Mask username: Ali***
        const name = String(w.username ?? "");
        const maskedName = name.length > 3
          ? name.slice(0, 3) + "***"
          : name + "***";

        const amount = Number(w.amount ?? 0);
        const method = String(w.method ?? "").replace('_', ' ');

        // Trigger toast
        toast.success(`Withdrawal Success!`, {
          description: `${maskedName} just withdrew $${amount.toFixed(2)} via ${method}`,
          icon: <BadgeDollarSign className="h-5 w-5 text-green-500" />,
          duration: 5000,
        });
      }
    });
  }, [withdrawals]);

  return null;
}
