"use client";

import { useState } from "react";

interface SendResult {
  success: boolean;
  error?: string;
}

export default function WhatsAppCampaign() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkCollection, setBulkCollection] = useState("nai-raha");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<SendResult | null>(null);
  const [logs, setLogs] = useState<Array<{ id: string; phone: string; success: boolean; error?: string; sentAt?: { toDate: () => Date } | null }>>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  async function sendSingleMessage(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, text: message }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: "Failed to send" });
    } finally {
      setLoading(false);
    }
  }

  async function startBulkSend(e: React.FormEvent) {
    e.preventDefault();
    setBulkLoading(true);
    setBulkResult(null);

    try {
      const res = await fetch("/api/bulk-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: bulkMessage, collection: bulkCollection }),
      });
      const data = await res.json();
      setBulkResult(data);
      loadLogs();
    } catch {
      setBulkResult({ success: false, error: "Failed to start bulk send" });
    } finally {
      setBulkLoading(false);
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/bulk-status?limit=50");
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch {
      console.error("Failed to load logs");
    } finally {
      setLogsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
          WhatsApp Campaign
        </h1>

        {/* Single Message */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
            Send Single Message
          </h2>
          <form onSubmit={sendSingleMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254712345678"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
          {result && (
            <div className={`mt-4 p-4 rounded-lg ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {result.success ? "✓ Message sent!" : `✗ Error: ${result.error}`}
            </div>
          )}
        </div>

        {/* Bulk Send */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
            Bulk WhatsApp Campaign
          </h2>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Anti-ban measures:</strong> Max 100 contacts per batch, 8s delay between messages, 60s delay between batches.
            </p>
          </div>
          <form onSubmit={startBulkSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Collection
              </label>
              <input
                type="text"
                value={bulkCollection}
                onChange={(e) => setBulkCollection(e.target.value)}
                placeholder="nai-raha"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                required
              />
              <p className="text-xs text-zinc-500 mt-1">
                Firestore collection name to fetch contacts from
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Message Template
              </label>
              <p className="text-xs text-zinc-500 mb-2">
                Placeholders: {`{{name}}`}, {`{{city}}`}, {`{{area}}`}, {`{{phone}}`}
              </p>
              <textarea
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                rows={6}
                placeholder="Hi {{name}}, we have special offers in {{city}}..."
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50"
                required
              />
            </div>
            <button
              type="submit"
              disabled={bulkLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {bulkLoading ? "Sending..." : "Start Bulk Send"}
            </button>
          </form>
          {bulkResult && (
            <div className={`mt-4 p-4 rounded-lg ${bulkResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {bulkResult.success ? (
                <div>
                  <p className="font-semibold">✓ Bulk send completed!</p>
                  <p className="text-sm mt-1">
                    Total: {bulkResult.results.total} | Sent: {bulkResult.results.sent} | Failed: {bulkResult.results.failed}
                  </p>
                </div>
              ) : (
                <p>✗ Error: {bulkResult.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Recent Logs
            </h2>
            <button
              onClick={loadLogs}
              disabled={logsLoading}
              className="px-4 py-2 text-sm bg-zinc-200 dark:bg-zinc-700 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600"
            >
              {logsLoading ? "Loading..." : "Refresh"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left py-2 text-zinc-600 dark:text-zinc-400">Phone</th>
                  <th className="text-left py-2 text-zinc-600 dark:text-zinc-400">Status</th>
                  <th className="text-left py-2 text-zinc-600 dark:text-zinc-400">Error</th>
                  <th className="text-left py-2 text-zinc-600 dark:text-zinc-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2 text-black dark:text-zinc-50">{log.phone}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${log.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {log.success ? "Sent" : "Failed"}
                      </span>
                    </td>
                    <td className="py-2 text-red-600">{log.error || "-"}</td>
                    <td className="py-2 text-zinc-500">
                      {log.sentAt?.toDate?.()?.toLocaleString() || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <p className="text-center text-zinc-500 py-4">No logs yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
