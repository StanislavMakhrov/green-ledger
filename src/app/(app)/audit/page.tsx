"use client";

import { useEffect, useState } from "react";

interface AuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  timestamp: string;
  comment: string | null;
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/audit?limit=100");
      const data = (await res.json()) as AuditEvent[];
      setEvents(data);
      setLoading(false);
    };
    void load();
  }, []);

  if (loading) return <p className="text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Audit Trail</h1>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Timestamp</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Entity</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actor</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(e.timestamp).toLocaleString("en-GB")}
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                    {e.entityType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      e.action === "created"
                        ? "bg-green-100 text-green-800"
                        : e.action === "updated"
                          ? "bg-blue-100 text-blue-800"
                          : e.action === "submitted"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {e.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{e.actor}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {e.comment ?? "—"}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  No audit events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
