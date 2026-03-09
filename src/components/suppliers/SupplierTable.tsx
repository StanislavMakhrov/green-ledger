"use client";

import { useState, useCallback, useEffect } from "react";
import { Table, Thead, Tbody, Th, Td, Tr } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import SupplierForm from "./SupplierForm";

interface Supplier {
  id: string;
  name: string;
  country: string;
  sector: string;
  contactEmail: string;
  publicFormToken: string;
  status: string;
}

interface SupplierTableProps {
  initialSuppliers: Supplier[];
}

export default function SupplierTable({ initialSuppliers }: SupplierTableProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch("/api/suppliers");
    const data = await res.json();
    setSuppliers(data);
  }, []);

  // Keep in sync with server
  useEffect(() => {
    setSuppliers(initialSuppliers);
  }, [initialSuppliers]);

  function getFormUrl(token: string) {
    return `${window.location.origin}/public/supplier/${token}`;
  }

  async function handleCopyLink(supplier: Supplier) {
    await navigator.clipboard.writeText(getFormUrl(supplier.publicFormToken));
    setCopiedId(supplier.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      await reload();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRefreshToken(id: string) {
    if (
      !confirm(
        "This will invalidate the current public form link. Continue?"
      )
    )
      return;
    setRefreshingId(id);
    try {
      await fetch(`/api/suppliers/${id}/refresh-token`, { method: "POST" });
      await reload();
    } finally {
      setRefreshingId(null);
    }
  }

  function handleEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setShowForm(true);
  }

  function handleFormSuccess() {
    setShowForm(false);
    setEditingSupplier(null);
    reload();
  }

  function handleFormCancel() {
    setShowForm(false);
    setEditingSupplier(null);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          + Add Supplier
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
          </h3>
          <SupplierForm
            supplier={editingSupplier ?? undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Card>
      )}

      {suppliers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No suppliers yet</p>
          <p className="text-sm mt-1">
            Add your first supplier to start collecting emissions data.
          </p>
        </div>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Name</Th>
              <Th>Country</Th>
              <Th>Sector</Th>
              <Th>Email</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {suppliers.map((supplier) => (
              <Tr key={supplier.id}>
                <Td className="font-medium">{supplier.name}</Td>
                <Td>{supplier.country}</Td>
                <Td>{supplier.sector}</Td>
                <Td>{supplier.contactEmail}</Td>
                <Td>
                  <Badge
                    variant={supplier.status === "active" ? "green" : "gray"}
                  >
                    {supplier.status}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopyLink(supplier)}
                    >
                      {copiedId === supplier.id ? "✓ Copied!" : "Copy Link"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(supplier)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRefreshToken(supplier.id)}
                      disabled={refreshingId === supplier.id}
                    >
                      {refreshingId === supplier.id
                        ? "Refreshing..."
                        : "Refresh Token"}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(supplier.id)}
                      disabled={deletingId === supplier.id}
                    >
                      {deletingId === supplier.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
