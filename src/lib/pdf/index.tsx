import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

export interface ReportData {
  company: {
    name: string;
    country: string;
    reportingYear: number;
    orgBoundary: string;
  };
  scope1Total: number;
  scope2Total: number;
  scope3Total: number;
  grandTotal: number;
  scope3Records: Array<{
    id: string;
    valueTco2e: number;
    calculationMethod: string;
    dataSource: string;
    assumptions: string | null;
    confidence: number;
    category: { code: string; name: string; material: boolean } | null;
    supplier: { name: string } | null;
  }>;
  scope3Categories: Array<{
    id: string;
    code: string;
    name: string;
    material: boolean;
    materialityReason: string | null;
  }>;
  methodologyNotes: Array<{
    scope: string;
    text: string;
  }>;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#555", marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "bold", marginTop: 20, marginBottom: 8, color: "#166534" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#166534",
    color: "white",
    padding: 5,
    fontWeight: "bold",
  },
  tableRow: { flexDirection: "row", padding: 5, borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
  col1: { width: "40%" },
  col2: { width: "20%" },
  col3: { width: "20%" },
  col4: { width: "20%" },
  text: { marginBottom: 6 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#999" },
});

function CsrdReport({ data }: { data: ReportData }) {
  const materialCategories = data.scope3Categories.filter((c) => c.material);
  const methodologyByScope: Record<string, string> = {};
  for (const note of data.methodologyNotes) {
    methodologyByScope[note.scope] = note.text;
  }

  const qualityRecords = data.scope3Records.filter(
    (r) => r.dataSource === "proxy" || r.confidence < 1 || r.assumptions
  );

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={{ marginTop: 100, marginBottom: 40 }}>
          <Text style={styles.title}>CSRD Climate Report</Text>
          <Text style={styles.subtitle}>
            {data.company.name} · {data.company.reportingYear} · {data.company.country}
          </Text>
          <Text style={{ fontSize: 10, color: "#777" }}>
            Generated: {new Date().toLocaleDateString("de-DE")}
          </Text>
        </View>
        <Text style={{ fontSize: 9, color: "#999", marginTop: 40 }}>
          Prepared in accordance with CSRD/ESRS E1. Proxy values are for demonstration only.
        </Text>
        <Text style={styles.footer} fixed>
          GreenLedger MVP · Confidential
        </Text>
      </Page>

      {/* Summary Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Emissions Summary — {data.company.reportingYear}</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Scope</Text>
          <Text style={styles.col2}>tCO₂e</Text>
          <Text style={styles.col3}>% of Total</Text>
        </View>
        {[
          { label: "Scope 1 — Direct", value: data.scope1Total },
          { label: "Scope 2 — Energy Indirect", value: data.scope2Total },
          { label: "Scope 3 — Value Chain", value: data.scope3Total },
        ].map((row) => (
          <View key={row.label} style={styles.tableRow}>
            <Text style={styles.col1}>{row.label}</Text>
            <Text style={styles.col2}>{row.value.toFixed(2)}</Text>
            <Text style={styles.col3}>
              {data.grandTotal > 0 ? ((row.value / data.grandTotal) * 100).toFixed(1) : "0.0"}%
            </Text>
          </View>
        ))}
        <View style={[styles.tableRow, { fontWeight: "bold" }]}>
          <Text style={styles.col1}>Grand Total</Text>
          <Text style={styles.col2}>{data.grandTotal.toFixed(2)}</Text>
          <Text style={styles.col3}>100.0%</Text>
        </View>
        <Text style={styles.footer} fixed>
          GreenLedger MVP · Confidential
        </Text>
      </Page>

      {/* Scope 3 Breakdown */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Scope 3 — Material Category Breakdown</Text>
        {materialCategories.length === 0 ? (
          <Text>No material categories identified.</Text>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Category</Text>
              <Text style={styles.col2}>tCO₂e</Text>
              <Text style={styles.col3}>Method</Text>
            </View>
            {materialCategories.map((cat) => {
              const catRecords = data.scope3Records.filter(
                (r) => r.category?.code === cat.code
              );
              const total = catRecords.reduce((s, r) => s + r.valueTco2e, 0);
              return (
                <View key={cat.id} style={styles.tableRow}>
                  <Text style={styles.col1}>{cat.code}: {cat.name}</Text>
                  <Text style={styles.col2}>{total.toFixed(2)}</Text>
                  <Text style={styles.col3}>{catRecords[0]?.calculationMethod ?? "—"}</Text>
                </View>
              );
            })}
          </>
        )}
        <Text style={styles.footer} fixed>
          GreenLedger MVP · Confidential
        </Text>
      </Page>

      {/* Methodology */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Methodology</Text>
        {["scope_1", "scope_2", "scope_3"].map((scope) => (
          <View key={scope} style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              {scope === "scope_1" ? "Scope 1" : scope === "scope_2" ? "Scope 2" : "Scope 3"}
            </Text>
            <Text style={styles.text}>
              {methodologyByScope[scope] ?? "No methodology note provided."}
            </Text>
          </View>
        ))}
        <Text style={styles.footer} fixed>
          GreenLedger MVP · Confidential
        </Text>
      </Page>

      {/* Data Quality */}
      {qualityRecords.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Assumptions & Data Quality</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Category</Text>
            <Text style={styles.col2}>Source</Text>
            <Text style={styles.col3}>Confidence</Text>
            <Text style={styles.col4}>Assumptions</Text>
          </View>
          {qualityRecords.map((r) => (
            <View key={r.id} style={styles.tableRow}>
              <Text style={styles.col1}>{r.category?.code ?? "—"}: {r.category?.name ?? "Unknown"}</Text>
              <Text style={styles.col2}>{r.dataSource}</Text>
              <Text style={styles.col3}>{(r.confidence * 100).toFixed(0)}%</Text>
              <Text style={styles.col4}>{r.assumptions ?? "—"}</Text>
            </View>
          ))}
          <Text style={styles.footer} fixed>
            GreenLedger MVP · Confidential
          </Text>
        </Page>
      )}
    </Document>
  );
}

export async function generateReport(data: ReportData): Promise<Buffer> {
  const buffer = await renderToBuffer(<CsrdReport data={data} />);
  return buffer;
}
