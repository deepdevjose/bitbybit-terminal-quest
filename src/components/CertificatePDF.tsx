import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { environments } from "@/lib/curriculum";
import type { CertificateRecord } from "@/lib/types";

export default function CertificatePDF({
  certificate,
  qrCodeUrl,
  accent,
  verificationUrl,
  recipientPhotoDataUrl,
  logoUrl,
  signatureDataUrl,
}: {
  certificate: CertificateRecord;
  qrCodeUrl: string;
  accent: string;
  verificationUrl: string;
  recipientPhotoDataUrl?: string | null;
  logoUrl?: string;
  signatureDataUrl?: string;
}) {
  const pathName = environments.find((environment) => environment.id === certificate.environmentId)?.name ?? certificate.environmentId;
  const title = "BitByBit Certified Terminal Operator";
  const subtitle = `Certificate of Completion - ${pathName} Path`;

  return (
    <Document title={`${title} - ${pathName} Path`} author="BitByBit Academy">
      <Page size="LETTER" style={styles.page}>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        <View style={styles.header}>
          {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
          <View>
            <Text style={styles.brand}>BitByBit Academy</Text>
            <Text style={styles.kicker}>Certificate of Completion / Recognition</Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.subtitle, { color: accent }]}>{subtitle}</Text>
          <Text style={styles.presented}>Issued to</Text>
          <View style={styles.recipientRow}>
            {recipientPhotoDataUrl ? <Image src={recipientPhotoDataUrl} style={styles.recipientPhoto} /> : null}
            <Text style={styles.name}>{certificate.issuedTo}</Text>
          </View>
          <Text style={styles.wording}>
            This recognition certifies completion of a practical command-line learning path covering terminal navigation, file operations, package/software management, permissions, processes, services, networking, scripting, automation, and real-world troubleshooting simulations.
          </Text>
          <View style={styles.grid}>
            <Field label="Completed path" value={`${pathName} Path`} />
            <Field label="Certificate ID" value={certificate.certificateId} />
            <Field label="Completion date" value={new Date(certificate.issuedAt).toLocaleDateString("en-US")} />
            <Field label="Total missions" value={String(certificate.totalMissions)} />
            <Field label="Total XP" value={String(certificate.totalXp)} />
          </View>
          <Text style={styles.skillsTitle}>Skills covered</Text>
          <Text style={styles.skills}>{certificate.skillsCovered.join(" • ")}</Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.issuer}>
            <Text style={styles.issuedBy}>Authorized issuer</Text>
            {signatureDataUrl ? <Image src={signatureDataUrl} style={styles.signature} /> : null}
            <Text style={styles.issuerName}>Jose Manuel Cortes Ceron</Text>
            <Text style={styles.issuerText}>Founder & Lead Instructor</Text>
            <Text style={styles.issuerText}>BitByBit Academy</Text>
            <View style={styles.issuerRule} />
            <Text style={styles.digitalOnly}>Digitally issued by BitByBit Academy</Text>
          </View>
          <View style={[styles.seal, { borderColor: accent }]}>
            <Text style={[styles.sealMain, { color: accent }]}>Verified Completion</Text>
            <Text style={styles.sealText}>BitByBit Academy</Text>
            <Text style={styles.sealText}>Terminal Quest</Text>
          </View>
          <View style={styles.qrWrap}>
            <Image src={qrCodeUrl} style={styles.qr} />
            <Text style={styles.verify}>Verify: {verificationUrl}</Text>
          </View>
        </View>
        <Text style={styles.disclaimer}>
          This is a BitByBit certificate of completion and recognition. It is not an official certification from Linux Foundation, Microsoft, Apple, Red Hat, Fedora, Debian, Ubuntu, or Arch Linux.
        </Text>
      </Page>
    </Document>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 34,
    backgroundColor: "#ffffff",
    color: "#18181b",
    fontFamily: "Helvetica",
    position: "relative",
  },
  accent: { position: "absolute", left: 0, top: 0, width: "100%", height: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 44, height: 44, borderRadius: 10 },
  brand: { fontSize: 16, fontWeight: 700 },
  kicker: { marginTop: 3, fontSize: 8, color: "#52525b", textTransform: "uppercase", letterSpacing: 1.2 },
  body: { marginTop: 30 },
  title: { fontSize: 27, lineHeight: 1.12, fontWeight: 700 },
  subtitle: { marginTop: 6, fontSize: 13, fontWeight: 700 },
  presented: { marginTop: 24, fontSize: 9, color: "#52525b", textTransform: "uppercase", letterSpacing: 1.2 },
  recipientRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 14 },
  recipientPhoto: { width: 42, height: 42, borderRadius: 8, objectFit: "cover" },
  name: { fontSize: 25, fontWeight: 700 },
  wording: { marginTop: 18, fontSize: 10.5, color: "#3f3f46", lineHeight: 1.45 },
  grid: { marginTop: 18, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  field: { width: "48.5%", border: "1px solid #d4d4d8", padding: 9, borderRadius: 7, backgroundColor: "#fafafa" },
  fieldLabel: { fontSize: 7, color: "#52525b", textTransform: "uppercase", letterSpacing: 0.8 },
  fieldValue: { marginTop: 4, fontSize: 10.5, fontWeight: 700 },
  skillsTitle: { marginTop: 16, fontSize: 8, color: "#52525b", textTransform: "uppercase", letterSpacing: 1 },
  skills: { marginTop: 6, fontSize: 8.5, color: "#3f3f46", lineHeight: 1.35 },
  footer: { marginTop: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 12 },
  issuer: { width: 226, border: "1px solid #d4d4d8", borderRadius: 8, backgroundColor: "#fafafa", padding: 10 },
  issuedBy: { fontSize: 7, color: "#52525b", textTransform: "uppercase", letterSpacing: 0.9 },
  signature: { marginTop: 4, width: 118, height: 36, objectFit: "contain" },
  issuerName: { marginTop: 2, fontSize: 10, color: "#18181b", fontWeight: 700 },
  issuerText: { marginTop: 2, fontSize: 8, color: "#52525b" },
  issuerRule: { height: 1, backgroundColor: "#d4d4d8", marginTop: 7, marginBottom: 6 },
  digitalOnly: { fontSize: 6, color: "#71717a", textTransform: "uppercase", letterSpacing: 0.7 },
  seal: { width: 92, height: 92, borderWidth: 2, borderRadius: 46, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  sealMain: { fontSize: 8.5, fontWeight: 700, textAlign: "center", textTransform: "uppercase", lineHeight: 1.2 },
  sealText: { marginTop: 3, fontSize: 6, color: "#3f3f46", textAlign: "center", textTransform: "uppercase", letterSpacing: 0.7 },
  qrWrap: { alignItems: "center" },
  qr: { width: 78, height: 78 },
  verify: { marginTop: 5, maxWidth: 148, fontSize: 6.5, color: "#52525b", textAlign: "center" },
  disclaimer: { position: "absolute", left: 34, right: 34, bottom: 18, fontSize: 6.5, color: "#71717a", lineHeight: 1.3 },
});
