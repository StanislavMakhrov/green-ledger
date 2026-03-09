import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatTco2e } from "../utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types for the PDF Report
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportScope3Category {
  code: string;
  name: string;
  material: boolean;
  totalTco2e: number;
}

export interface ReportAssumptionRecord {
  supplierName: string;
  categoryCode: string;
  categoryName: string;
  assumptions: string;
  confidence: number;
  dataSource: string;
  valueTco2e: number;
}

export interface ReportData {
  companyName: string;
  reportingYear: number;
  scope1Total: number;
  scope2Total: number;
  scope3Total: number;
  total: number;
  scope3Categories: ReportScope3Category[];
  hasNonMaterialRecords: boolean;
  methodologyScope1: string;
  methodologyScope2: string;
  methodologyScope3: string;
  assumptionRecords: ReportAssumptionRecord[];
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// React-PDF Report Template
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PDF Report Document component using @react-pdf/renderer primitives.
 * Renders all five required report sections:
 * 1. Cover page
 * 2. Summary table
 * 3. Scope 3 breakdown (material categories)
 * 4. Methodology section
 * 5. Assumptions & data quality table
 */
export function ReportDocument({ data }: { data: ReportData }) {
  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: "Helvetica",
      fontSize: 10,
      color: "#1a1a1a",
    },
    coverPage: {
      justifyContent: "center",
      alignItems: "center",
    },
    coverTitle: {
      fontSize: 28,
      fontFamily: "Helvetica-Bold",
      marginBottom: 12,
      color: "#166534",
    },
    coverSubtitle: {
      fontSize: 16,
      marginBottom: 8,
      color: "#374151",
    },
    coverMeta: {
      fontSize: 12,
      color: "#6b7280",
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      marginBottom: 10,
      marginTop: 20,
      color: "#166534",
      borderBottomWidth: 1,
      borderBottomColor: "#d1fae5",
      paddingBottom: 4,
    },
    table: {
      marginTop: 8,
      marginBottom: 12,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#f0fdf4",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: "#d1fae5",
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#f3f4f6",
      paddingVertical: 5,
      paddingHorizontal: 4,
    },
    tableRowAlt: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#f3f4f6",
      paddingVertical: 5,
      paddingHorizontal: 4,
      backgroundColor: "#fafafa",
    },
    colScope: { width: "40%", fontSize: 10 },
    colValue: { width: "30%", textAlign: "right", fontSize: 10 },
    colPct: { width: "30%", textAlign: "right", fontSize: 10, color: "#6b7280" },
    headerText: {
      fontFamily: "Helvetica-Bold",
      fontSize: 9,
      color: "#374151",
    },
    totalRow: {
      flexDirection: "row",
      borderTopWidth: 2,
      borderTopColor: "#166534",
      paddingVertical: 6,
      paddingHorizontal: 4,
      backgroundColor: "#f0fdf4",
    },
    totalText: {
      fontFamily: "Helvetica-Bold",
      fontSize: 11,
    },
    bodyText: {
      fontSize: 10,
      lineHeight: 1.5,
      color: "#374151",
      marginBottom: 8,
    },
    footnote: {
      fontSize: 8,
      color: "#6b7280",
      marginTop: 6,
      fontStyle: "italic",
    },
    badge: {
      backgroundColor: "#dcfce7",
      color: "#166534",
      fontSize: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    assumptionCol1: { width: "15%", fontSize: 9 },
    assumptionCol2: { width: "20%", fontSize: 9 },
    assumptionCol3: { width: "35%", fontSize: 9, color: "#374151" },
    assumptionCol4: { width: "15%", textAlign: "right", fontSize: 9 },
    assumptionCol5: { width: "15%", textAlign: "right", fontSize: 9 },
  });

  const pct = (value: number, total: number): string => {
    if (total === 0) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  return (
    <Document
      title={`CSRD Climate Report ${data.reportingYear} — ${data.companyName}`}
      author="GreenLedger"
    >
      {/* ── Cover Page ───────────────────────────────────────────────────── */}
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <View>
          <Text style={styles.coverTitle}>CSRD Climate Report</Text>
          <Text style={styles.coverSubtitle}>{data.companyName}</Text>
          <Text style={styles.coverSubtitle}>
            Reporting Year: {data.reportingYear}
          </Text>
          <Text style={styles.coverMeta}>
            Generated: {data.generatedAt}
          </Text>
          <Text style={styles.coverMeta}>
            Prepared with GreenLedger — Demo Report
          </Text>
          <Text
            style={[
              styles.coverMeta,
              { marginTop: 32, fontSize: 9, color: "#9ca3af" },
            ]}
          >
            This document is generated from demo data and is not intended for
            regulatory submission.
          </Text>
        </View>
      </Page>

      {/* ── Summary Table ────────────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>1. Emissions Summary</Text>
        <Text style={styles.bodyText}>
          Total greenhouse gas emissions for {data.companyName} for the
          reporting year {data.reportingYear}, expressed in metric tonnes of
          CO₂ equivalent (tCO₂e).
        </Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colScope, styles.headerText]}>Scope</Text>
            <Text style={[styles.colValue, styles.headerText]}>tCO₂e</Text>
            <Text style={[styles.colPct, styles.headerText]}>% of Total</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.colScope}>Scope 1 — Direct emissions</Text>
            <Text style={styles.colValue}>{formatTco2e(data.scope1Total)}</Text>
            <Text style={styles.colPct}>
              {pct(data.scope1Total, data.total)}
            </Text>
          </View>

          <View style={styles.tableRowAlt}>
            <Text style={styles.colScope}>
              Scope 2 — Indirect (energy)
            </Text>
            <Text style={styles.colValue}>{formatTco2e(data.scope2Total)}</Text>
            <Text style={styles.colPct}>
              {pct(data.scope2Total, data.total)}
            </Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.colScope}>
              Scope 3 — Value chain
            </Text>
            <Text style={styles.colValue}>{formatTco2e(data.scope3Total)}</Text>
            <Text style={styles.colPct}>
              {pct(data.scope3Total, data.total)}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={[styles.colScope, styles.totalText]}>
              Total Emissions
            </Text>
            <Text style={[styles.colValue, styles.totalText]}>
              {formatTco2e(data.total)}
            </Text>
            <Text style={[styles.colPct, styles.totalText]}>100%</Text>
          </View>
        </View>

        {/* ── Scope 3 Breakdown ─────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>2. Scope 3 Category Breakdown</Text>
        <Text style={styles.bodyText}>
          Material Scope 3 categories identified for {data.reportingYear}.
          Only categories marked as material are included in this breakdown.
        </Text>

        {data.scope3Categories.length === 0 ? (
          <Text style={styles.bodyText}>
            No material Scope 3 categories have been identified for this
            reporting period.
          </Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[{ width: "15%" }, styles.headerText]}>Code</Text>
              <Text style={[{ width: "55%" }, styles.headerText]}>
                Category
              </Text>
              <Text
                style={[
                  { width: "30%", textAlign: "right" },
                  styles.headerText,
                ]}
              >
                tCO₂e
              </Text>
            </View>

            {data.scope3Categories.map((cat, i) => (
              <View
                key={cat.code}
                style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={{ width: "15%", fontSize: 10 }}>{cat.code}</Text>
                <Text style={{ width: "55%", fontSize: 10 }}>{cat.name}</Text>
                <Text
                  style={{
                    width: "30%",
                    textAlign: "right",
                    fontSize: 10,
                  }}
                >
                  {formatTco2e(cat.totalTco2e)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {data.hasNonMaterialRecords && (
          <Text style={styles.footnote}>
            * Some Scope 3 records exist for non-material categories. These are
            excluded from the breakdown above but are included in the Scope 3
            total.
          </Text>
        )}
      </Page>

      {/* ── Methodology ──────────────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>3. Methodology</Text>

        <Text
          style={[styles.sectionTitle, { fontSize: 11, color: "#374151" }]}
        >
          Scope 1
        </Text>
        <Text style={styles.bodyText}>
          {data.methodologyScope1 ||
            "No methodology notes recorded for Scope 1."}
        </Text>

        <Text
          style={[styles.sectionTitle, { fontSize: 11, color: "#374151" }]}
        >
          Scope 2
        </Text>
        <Text style={styles.bodyText}>
          {data.methodologyScope2 ||
            "No methodology notes recorded for Scope 2."}
        </Text>

        <Text
          style={[styles.sectionTitle, { fontSize: 11, color: "#374151" }]}
        >
          Scope 3
        </Text>
        <Text style={styles.bodyText}>
          {data.methodologyScope3 ||
            "No methodology notes recorded for Scope 3."}
        </Text>
      </Page>

      {/* ── Assumptions & Data Quality ────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>
          4. Assumptions & Data Quality
        </Text>
        <Text style={styles.bodyText}>
          The following Scope 3 records use proxy estimates, have confidence
          below 1.0, or include documented assumptions. This section supports
          auditor review of data quality.
        </Text>

        {data.assumptionRecords.length === 0 ? (
          <Text style={styles.bodyText}>
            No proxy records or low-confidence records identified.
          </Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.assumptionCol1, styles.headerText]}>
                Category
              </Text>
              <Text style={[styles.assumptionCol2, styles.headerText]}>
                Supplier
              </Text>
              <Text style={[styles.assumptionCol3, styles.headerText]}>
                Assumptions
              </Text>
              <Text style={[styles.assumptionCol4, styles.headerText]}>
                Confidence
              </Text>
              <Text style={[styles.assumptionCol5, styles.headerText]}>
                tCO₂e
              </Text>
            </View>

            {data.assumptionRecords.map((rec, i) => (
              <View
                key={i}
                style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={styles.assumptionCol1}>
                  {rec.categoryCode}
                </Text>
                <Text style={styles.assumptionCol2}>
                  {rec.supplierName}
                </Text>
                <Text style={styles.assumptionCol3}>
                  {rec.assumptions || "—"}
                </Text>
                <Text style={styles.assumptionCol4}>
                  {(rec.confidence * 100).toFixed(0)}%
                </Text>
                <Text style={styles.assumptionCol5}>
                  {formatTco2e(rec.valueTco2e)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.footnote, { marginTop: 16 }]}>
          Confidence scores: 0.4 = spend-based proxy (low), 0.5 =
          activity-based proxy, 0.7–1.0 = verified or supplier-provided data.
          Records flagged here are those where confidence &lt; 1.0 or
          assumptions field is populated.
        </Text>
      </Page>
    </Document>
  );
}
