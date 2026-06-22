import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { environments } from "@/lib/curriculum";
import type { TranslationKey } from "@/lib/i18n";
import { getCertificateById, getCertificateByVerificationSlug, getProgress } from "@/lib/progressStore";
import type { CertificateRecord, EnvironmentId, UserProgress } from "@/lib/types";
import { useI18n } from "@/lib/useI18n";

const CertificateDownload = lazy(() => import("./CertificateDownload"));

class CertificateDownloadBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function CertificateView({ certificateId, verificationSlug, environmentId }: { certificateId?: string; verificationSlug?: string; environmentId?: EnvironmentId }) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    getProgress().then(setProgress);
    const lookup = certificateId ? getCertificateById(certificateId) : verificationSlug ? getCertificateByVerificationSlug(verificationSlug) : Promise.resolve(undefined);
    lookup.then((record) => {
      if (!record) return;
      setCertificate(record);
    });
  }, [certificateId, verificationSlug]);

  if (!progress) return <main className="mx-auto max-w-5xl px-6 py-16 text-zinc-400">{t("common.loadingDeck")}</main>;
  if (!certificate && certificateId) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <section className="glass rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-white">{t("certificate.notFound")}</h1>
          <a className="primary-action mt-5 inline-flex rounded-md px-5 py-3 text-sm font-semibold" href="/profile/certificates">{t("profile.title")}</a>
        </section>
      </main>
    );
  }

  const fallbackEnvironment = environments.find((item) => item.id === environmentId) ?? environments[0];
  const environment = environments.find((item) => item.id === certificate?.environmentId) ?? fallbackEnvironment;
  const environmentName = t(`environment.${environment.id}.name` as TranslationKey);
  const viewRecord = certificate ?? {
    id: "preview",
    userId: progress.id,
    environmentId: environment.id,
    certificateId: `BBB-${environment.id.toUpperCase()}-PREVIEW`,
    title: t("certificate.title", { environment: environmentName }),
    issuedTo: progress.displayName,
    issuedAt: new Date().toISOString(),
    totalMissions: environment.levels.flatMap((level) => level.missions).length,
    totalXp: progress.globalXp,
    skillsCovered: environment.levels.map((level) => t(`level.${environment.id}.${level.id}.title` as TranslationKey)),
    verificationSlug: `preview-${environment.id}`,
    isPublic: true,
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <section className="glass rounded-lg p-8">
        <p className="subtle-label">{t("app.name")}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">{viewRecord.title}</h1>
        <p className="mt-4 text-zinc-400">{t("certificate.disclaimer")}</p>
        <p className="mt-6 max-w-3xl leading-7 text-zinc-300">{t("certificate.wording")}</p>
        <dl className="mt-8 grid gap-4 md:grid-cols-2">
          <CertificateRow label={t("certificate.completedBy")} value={viewRecord.issuedTo} />
          <CertificateRow label={t("certificate.completionDate")} value={new Date(viewRecord.issuedAt).toLocaleDateString()} />
          <CertificateRow label={t("certificate.id")} value={viewRecord.certificateId} />
          <CertificateRow label={t("certificate.totalMissions")} value={String(viewRecord.totalMissions)} />
          <CertificateRow label={t("certificate.totalXp")} value={String(viewRecord.totalXp)} />
          <CertificateRow label={t("certificate.verify")} value={`${window.location.origin}/verify/${viewRecord.verificationSlug}`} />
        </dl>
        <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <div className="text-xs uppercase tracking-[0.08em] text-zinc-500">{t("certificate.skills")}</div>
          <p className="mt-2 text-sm leading-6 text-white">{viewRecord.skillsCovered.join(" • ")}</p>
        </div>
        <CertificateDownloadBoundary fallback={<DownloadFallback t={t} verificationSlug={viewRecord.verificationSlug} />}>
          <Suspense fallback={<div className="mt-8 text-sm text-zinc-400">{t("common.loadingDeck")}</div>}>
            <CertificateDownload certificate={viewRecord} accent={environment.accent} />
          </Suspense>
        </CertificateDownloadBoundary>
      </section>
    </main>
  );
}

function DownloadFallback({ t, verificationSlug }: { t: (key: TranslationKey, params?: Record<string, string | number>) => string; verificationSlug: string }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <p className="basis-full text-sm text-red-300">No se pudo cargar el generador de PDF. Recarga la pagina e intenta otra vez.</p>
      <a className="secondary-action inline-flex rounded-md px-5 py-3 text-sm font-semibold" href={`/verify/${verificationSlug}`}>
        {t("certificate.publicVerification")}
      </a>
    </div>
  );
}

function CertificateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <dt className="text-xs uppercase tracking-[0.08em] text-zinc-500">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}
