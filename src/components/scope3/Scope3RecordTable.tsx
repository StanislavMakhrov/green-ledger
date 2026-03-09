"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Thead, Tbody, Th, Td, Tr } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatTco2e } from "@/lib/utils";
import Scope3RecordForm from "./Scope3RecordForm";

interface Scope3Category {
  id: string;
  code: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Scope3Record {
  id: string;
  periodYear: number;
  valueTco2e: number;
  calculationMethod: string;
  dataSource: string;
  confidence: number;
  supplierId: string | null;
  supplier: Supplier | null;
  category: Scope3Category;
  createdAt: string | Date;
}

interface Scope3RecordTableProps {
  initialRecords: Scope3Record[];
  categories: Scope3Category[];
  suppliers: Supplier[];
}

export default function Scope3RecordTable({
  initialRecords,
  categories,
  suppliers,
}: Scope3RecordTableProps) {
  const [records, setRecords] = useState<Scope3Record[]>(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  const reload = useCallback(async () => {
    const res = await fetch("/api/scope3/records");
    const data = await res.json();
    setRecords(data);
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this record?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/scope3/records/${id}`, { method: "DELETE" });
      await reload();
    } finally {
      setDeletingId(null);
    }
  }

  function getConfidenceBadge(confidence: number) {
    if (confidence >= 0.9) return <Badge variant="green">{(confidence * 100).toFixed(0)}%</Badge>;
    if (confidence >= 0.6) return <Badge variant="yellow">{(confidence * 100).toFixed(0)}%</Badge>;
    return <Badge variant="red">{(confidence * 100).toFixed(0)}%</Badge>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          {records.length} record{records.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          + Add Record
        </Button>
      </div>

      {showForm && (
        <Scope3RecordForm
          categories={categories}
          suppliers={suppliers}
          onSuccess={() => {
            setShowForm(false);
            reload();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {records.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No Scope 3 records yet</p>
          <p className="text-sm mt-1">
            Add supply chain emission records manually or collect from suppliers via the public form.
          </p>
        </div>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Category</Th>
              <Th>Supplier</Th>
              <Th>Year</Th>
              <Th>tCO₂e</Th>
              <Th>Method</Th>
              <Th>Source</Th>
              <Th>Confidence</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {records.map((record) => (
              <Tr key={record.id}>
                <Td className="font-medium">
                  {record.category.code} — {record.category.name}
                </Td>
                <Td>{record.supplier?.name ?? "—"}</Td>
                <Td>{record.periodYear}</Td>
                <Td className="font-mono font-medium">
                  {formatTco2e(record.valueTco2e)}
                </Td>
                <Td>
                  <Badge variant="gray">{record.calculationMethod}</Badge>
                </Td>
                <Td>
                  <Badge
                    variant={
                      record.dataSource === "supplier_form"
                        ? "blue"
                        : record.dataSource === "proxy"
                          ? "yellow"
                          : "green"
                    }
                  >
                    {record.dataSource}
                  </Badge>
                </Td>
                <Td>{getConfidenceBadge(record.confidence)}</Td>
                <Td>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(record.id)}
                    disabled={deletingId === record.id}
                  >
                    {deletingId === record.id ? "Deleting..." : "Delete"}
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
