import { useEffect, useState } from "react";
import { getNextAction, getProgress } from "@/lib/progressStore";
import { useI18n } from "@/lib/useI18n";

export default function LandingCTA() {
  const [href, setHref] = useState("/auth/register");
  const [loggedIn, setLoggedIn] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    getProgress().then((progress) => {
      setLoggedIn(progress.isAuthenticated);
      setHref(progress.isAuthenticated ? getNextAction(progress).href : "/auth/register");
    });
  }, []);

  return (
    <a className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md bg-zinc-950 px-6 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800" href={href}>
      {loggedIn ? t("landing.dashboard") : t("landing.start")}
    </a>
  );
}
