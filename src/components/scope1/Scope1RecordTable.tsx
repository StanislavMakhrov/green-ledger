"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Thead, Tbody, Th, Td, Tr } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatTco2e } from "@/lib/utils";
import Scope1RecordForm from "./Scope1RecordForm";

interface Scope1Record {
  id: string;
  periodYear: number;
  valueTco2e: number;
  calculationMethod: string;
  emissionFactorsSource: string;
  dataSource: string;
  assumptions: string | null;
  createdAt: string | Date;
}

interface Scope1RecordTableProps {
  initialRecords: Scope1Record[];
}

export default function Scope1RecordTable({
  initialRecords,
}: Scope1RecordTableProps) {
  const [records, setRecords] = useState<Scope1Record[]>(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  const reload = useCallback(async () => {
    const res = await fetch("/api/scope1");
    const data = await res.json();
    setRecords(data);
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this record?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/scope1/${id}`, { method: "DELETE" });
      await reload();
    } finally {
      setDeletingId(null);
    }
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
        <Scope1RecordForm
          onSuccess={() => {
            setShowForm(false);
            reload();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {records.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No Scope 1 records yet</p>
          <p className="text-sm mt-1">
            Add direct emission records from your facilities and vehicles.
          </p>
        </div>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Year</Th>
              <Th>tCO₂e</Th>
              <Th>Method</Th>
              <Th>EF Source</Th>
              <Th>Data Source</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {records.map((record) => (
              <Tr key={record.id}>
                <Td>{record.periodYear}</Td>
                <Td className="font-mono font-medium">
                  {formatTco2e(record.valueTco2e)}
                </Td>
                <Td className="max-w-xs truncate">{record.calculationMethod}</Td>
                <Td>{record.emissionFactorsSource}</Td>
                <Td>
                  <Badge variant={record.dataSource === "manual" ? "green" : "blue"}>
                    {record.dataSource}
                  </Badge>
                </Td>
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
