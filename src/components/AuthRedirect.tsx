import { useEffect } from "react";
import { getNextAction, getProgress } from "@/lib/progressStore";

export default function AuthRedirect() {
  useEffect(() => {
    getProgress().then((progress) => {
      if (progress.isAuthenticated) window.location.href = getNextAction(progress).href;
    });
  }, []);

  return null;
}
