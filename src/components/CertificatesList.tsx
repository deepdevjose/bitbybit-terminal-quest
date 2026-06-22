import { useEffect, useState } from "react";
import { environments } from "@/lib/curriculum";
import type { TranslationKey } from "@/lib/i18n";
import { ensureCertificate, getCertificates, getProgress, isEnvironmentPathComplete } from "@/lib/progressStore";
import type { CertificateRecord, UserProgress } from "@/lib/types";
import { useI18n } from "@/lib/useI18n";

export default function CertificatesList() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [error, setError] = useState("");
  const { t } = useI18n();

  async function refresh() {
    setProgress(await getProgress());
    setCertificates(await getCertificates());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create(environmentId: CertificateRecord["environmentId"]) {
    try {
      setError("");
      await ensureCertificate(environmentId);
      await refresh();
    } catch {
      setError(t("certificate.incompleteError"));
    }
  }

  if (!progress) return <main className="mx-auto max-w-5xl px-6 py-16 text-zinc-400">{t("common.loadingDeck")}</main>;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-4xl font-semibold tracking-tight text-white">{t("certificate.listTitle")}</h1>
      <p className="mt-3 text-zinc-400">{t("certificate.listCopy")}</p>
      {error ? <p className="mt-5 rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">{error}</p> : null}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {environments.map((environment) => {
          const record = certificates.find((certificate) => certificate.environmentId === environment.id);
          const complete = isEnvironmentPathComplete(environment.id, progress);
          return (
            <article key={environment.id} className="glass rounded-lg p-5">
              <div className="mb-5 h-1 rounded-full bg-white/15">
                <div className="h-full w-1/3 rounded-full" style={{ background: environment.accent }} />
              </div>
              <h2 className="text-xl font-semibold text-white">{t(`environment.${environment.id}.name` as TranslationKey)}</h2>
              <p className="mt-3 text-sm text-zinc-400">{complete ? t("certificate.pathComplete") : t("certificate.pathLocked")}</p>
              <div className="mt-5 flex gap-3">
                {record ? (
                  <>
                    <a className="primary-action rounded-md px-4 py-2 text-sm font-semibold" href={`/certificate/${record.certificateId}`}>{t("certificate.view")}</a>
                    <a className="secondary-action rounded-md px-4 py-2 text-sm font-semibold" href={`/verify/${record.verificationSlug}`}>{t("certificate.publicVerification")}</a>
                  </>
                ) : (
                  <button className="primary-action rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={!complete} onClick={() => create(environment.id)}>
                    {t("certificate.generate")}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
