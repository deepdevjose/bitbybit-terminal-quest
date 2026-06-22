import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { environments } from "@/lib/curriculum";
import type { CertificateRecord } from "@/lib/types";

export default function CertificatePDF({
  certificate,
  qrCodeUrl,
  accent,
  verificationUrl,
  recipientPhotoDataUrl,
}: {
  certificate: CertificateRecord;
  qrCodeUrl: string;
  accent: string;
  verificationUrl: string;
  recipientPhotoDataUrl?: string | null;
}) {
  const pathName = environments.find((environment) => environment.id === certificate.environmentId)?.name ?? certificate.environmentId;
  const title = "BitByBit Certified Terminal Operator";
  const subtitle = `Certificate of Completion - ${pathName} Path`;

  return (
    <Document title={`${title} - ${pathName} Path`} author="BitByBit Academy">
      <Page size="LETTER" style={styles.page}>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        <View style={styles.header}>
          <Image src="/icon.png" style={styles.logo} />
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
    padding: 46,
    backgroundColor: "#08090c",
    color: "#f5f5f7",
    fontFamily: "Helvetica",
    position: "relative",
  },
  accent: { position: "absolute", left: 0, top: 0, width: "100%", height: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 14 },
  logo: { width: 54, height: 54, borderRadius: 12 },
  brand: { fontSize: 18, fontWeight: 700 },
  kicker: { marginTop: 4, fontSize: 9, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 1.5 },
  body: { marginTop: 48 },
  title: { fontSize: 30, lineHeight: 1.16, fontWeight: 700 },
  subtitle: { marginTop: 8, fontSize: 15, fontWeight: 700 },
  presented: { marginTop: 34, fontSize: 11, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 1.4 },
  recipientRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 14 },
  recipientPhoto: { width: 54, height: 54, borderRadius: 10, objectFit: "cover" },
  name: { fontSize: 28, fontWeight: 700 },
  wording: { marginTop: 24, fontSize: 12, color: "#d4d4d8", lineHeight: 1.65 },
  grid: { marginTop: 26, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  field: { width: "48%", border: "1px solid #27272a", padding: 12, borderRadius: 8, backgroundColor: "#111318" },
  fieldLabel: { fontSize: 8, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 1 },
  fieldValue: { marginTop: 5, fontSize: 12, fontWeight: 700 },
  skillsTitle: { marginTop: 24, fontSize: 9, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 1.2 },
  skills: { marginTop: 8, fontSize: 10, color: "#d4d4d8", lineHeight: 1.5 },
  footer: { marginTop: 34, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 16 },
  issuer: { width: 230, border: "1px solid #27272a", borderRadius: 8, backgroundColor: "#111318", padding: 12 },
  issuedBy: { fontSize: 8, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 1 },
  issuerName: { marginTop: 10, fontSize: 11, color: "#f5f5f7", fontWeight: 700 },
  issuerText: { marginTop: 3, fontSize: 9, color: "#a1a1aa" },
  issuerRule: { height: 1, backgroundColor: "#3f3f46", marginTop: 10, marginBottom: 8 },
  digitalOnly: { fontSize: 7, color: "#71717a", textTransform: "uppercase", letterSpacing: 0.8 },
  seal: { width: 112, height: 112, borderWidth: 2, borderRadius: 56, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  sealMain: { fontSize: 10, fontWeight: 700, textAlign: "center", textTransform: "uppercase", lineHeight: 1.25 },
  sealText: { marginTop: 4, fontSize: 7, color: "#d4d4d8", textAlign: "center", textTransform: "uppercase", letterSpacing: 0.8 },
  qrWrap: { alignItems: "center" },
  qr: { width: 84, height: 84 },
  verify: { marginTop: 6, maxWidth: 160, fontSize: 7, color: "#a1a1aa", textAlign: "center" },
  disclaimer: { position: "absolute", left: 46, right: 46, bottom: 24, fontSize: 7, color: "#71717a", lineHeight: 1.4 },
});
