import { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { getProgress } from "@/lib/progressStore";
import type { CertificateRecord } from "@/lib/types";
import { useI18n } from "@/lib/useI18n";
import signatureDataUrl from "@/assets/sign.png?inline";
import CertificatePDF from "./CertificatePDF";

export default function CertificateDownload({ certificate, accent }: { certificate: CertificateRecord; accent: string }) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [recipientPhotoDataUrl, setRecipientPhotoDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const { locale, t } = useI18n();

  useEffect(() => {
    setError("");
    QRCode.toDataURL(`${window.location.origin}/verify/${certificate.verificationSlug}`, { margin: 1, width: 240 }).then(setQrCodeUrl);
    getProgress().then((progress) => {
      if (progress.displayName === certificate.issuedTo) setRecipientPhotoDataUrl(progress.profilePhotoDataUrl ?? null);
    });
  }, [certificate.issuedTo, certificate.verificationSlug]);

  async function downloadPdf() {
    if (!qrCodeUrl || isGenerating) return;
    setIsGenerating(true);
    setError("");

    try {
      const pdfDocument = (
        <CertificatePDF
          certificate={certificate}
          qrCodeUrl={qrCodeUrl}
          accent={accent}
          verificationUrl={`${window.location.origin}/verify/${certificate.verificationSlug}`}
          recipientPhotoDataUrl={recipientPhotoDataUrl}
          logoUrl={`${window.location.origin}/icon.png`}
          signatureDataUrl={signatureDataUrl}
        />
      );
      const blob = await pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certificate.certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error(downloadError);
      setError(locale === "es-MX" ? "No se pudo generar el PDF. Intenta de nuevo." : "The PDF could not be generated. Try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      {qrCodeUrl ? <img className="h-28 w-28 rounded-md bg-white p-2" src={qrCodeUrl} alt="QR code" /> : null}
      <button
        className="primary-action inline-flex rounded-md px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        disabled={!qrCodeUrl || isGenerating}
        onClick={downloadPdf}
      >
        {isGenerating ? (locale === "es-MX" ? "Generando PDF..." : "Generating PDF...") : t("certificate.downloadPdf")}
      </button>
      <a className="secondary-action inline-flex rounded-md px-5 py-3 text-sm font-semibold" href={`/verify/${certificate.verificationSlug}`}>
        {t("certificate.publicVerification")}
      </a>
      {error ? <p className="basis-full text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
