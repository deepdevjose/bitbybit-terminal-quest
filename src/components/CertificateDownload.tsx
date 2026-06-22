import { useEffect, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { getProgress } from "@/lib/progressStore";
import type { CertificateRecord } from "@/lib/types";
import { useI18n } from "@/lib/useI18n";
import CertificatePDF from "./CertificatePDF";

export default function CertificateDownload({ certificate, accent }: { certificate: CertificateRecord; accent: string }) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [recipientPhotoDataUrl, setRecipientPhotoDataUrl] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/verify/${certificate.verificationSlug}`, { margin: 1, width: 240 }).then(setQrCodeUrl);
    getProgress().then((progress) => {
      if (progress.displayName === certificate.issuedTo) setRecipientPhotoDataUrl(progress.profilePhotoDataUrl ?? null);
    });
  }, [certificate.issuedTo, certificate.verificationSlug]);

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      {qrCodeUrl ? <img className="h-28 w-28 rounded-md bg-white p-2" src={qrCodeUrl} alt="QR code" /> : null}
      {qrCodeUrl ? (
        <PDFDownloadLink
          className="primary-action inline-flex rounded-md px-5 py-3 text-sm font-semibold"
          document={
            <CertificatePDF
              certificate={certificate}
              qrCodeUrl={qrCodeUrl}
              accent={accent}
              verificationUrl={`${window.location.origin}/verify/${certificate.verificationSlug}`}
              recipientPhotoDataUrl={recipientPhotoDataUrl}
            />
          }
          fileName={`${certificate.certificateId}.pdf`}
        >
          {t("certificate.downloadPdf")}
        </PDFDownloadLink>
      ) : null}
      <a className="secondary-action inline-flex rounded-md px-5 py-3 text-sm font-semibold" href={`/verify/${certificate.verificationSlug}`}>
        {t("certificate.publicVerification")}
      </a>
    </div>
  );
}
