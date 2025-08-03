'use client';
import { useState } from 'react';

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    testCode?: string;
    output?: string;
    error?: string;
    fix?: string;
  } | null>(null);
  const [runOutput, setRunOutput] = useState('');

  const runTest = async (fnName: string) => {
    const res = await fetch('/api/run-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: fnName }),
    });
    const json = await res.json();
    setRunOutput(json.output);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setRunOutput('');

    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/generate-tests', { method: 'POST', body });
    const json = await res.json();
    setResult(json);
    if (json.testCode) {
      const m = await file.text();
      const name = m.match(/(?:export\s+)?(?:function|const|let|var)\s+([a-zA-Z0-9_]+)/)?.[1] || 'unknown';
      runTest(name);
    }
    setLoading(false);
  };

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">AI Unit-Test Generator</h1>

      <input
        type="file"
        accept=".ts"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block mb-4"
      />
      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Running…' : 'Generate & Test'}
      </button>

      {result && (
        <section className="mt-8">
          {result.ok ? (
            <>
              <h2 className="font-bold mb-2">✅ All tests passed</h2>
              <pre className="bg-slate-800 text-slate-100 p-4 text-sm rounded max-h-96 overflow-auto">
                {result.testCode}
              </pre>
            </>
          ) : (
            <>
              <h2 className="font-bold mb-2">❌ Tests failed (3 attempts)</h2>
              <pre className="bg-red-100 text-red-900 p-4 text-sm rounded">
                {result.output || result.error}
              </pre>
              <h3 className="font-bold mt-4 mb-2">💡 AI Suggestions</h3>
              <pre className="bg-yellow-100 text-yellow-900 p-4 text-sm rounded">
                {result.fix}
              </pre>
            </>
          )}
        </section>
      )}

      {runOutput && (
        <pre className="bg-black text-green-400 p-4 text-xs rounded max-h-64 overflow-auto mt-4">
          {runOutput}
        </pre>
      )}
    </main>
  );
}