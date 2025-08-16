"use client";

import { useState, useEffect, useRef } from "react";

export default function HomePage() {
  const [code, setCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [explanation, setExplanation] = useState(""); // NEW: Function explanation
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [typedText, setTypedText] = useState("");
  const [dark, setDark] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [model, setModel] = useState("gemini");
  const [abortController, setAbortController] = useState<AbortController | null>(null); // NEW: For stopping requests
  const [streamingStatus, setStreamingStatus] = useState(""); // NEW: Status updates during streaming
  const resultsRef = useRef<HTMLDivElement>(null);

  const models = [
    { id: "gemini", name: "Google Gemini" },
    { id: "openal/gpt-oss-20bfree", name: "OpenAI GPT-3.5 (via OpenRouter)" },
    { id: "qwen/qwen3-coderfree", name: "Qwen Coder (via OpenRouter)" },
  ];

  const typeText = async (text: string) => {
    setIsTyping(true);
    setTypedText("");

    for (let i = 0; i < text.length; i++) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 10 + 10)
      );
      setTypedText((prev) => prev + text[i]);

      if (resultsRef.current && i % 10 === 0) {
        resultsRef.current.scrollTop = resultsRef.current.scrollHeight;
      }
    }

    setIsTyping(false);
  };

  // NEW: Stop the current process
  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setLoading(false);
    setIsTyping(false);
    setStreamingStatus("");
    setResult({
      ok: false,
      error: "Process stopped by user",
      output: "Generation was cancelled"
    });
  };

  const handleSubmit = async () => {
    const hasCode = code.trim().length > 0;
    const hasFile = file !== null;

    if (!hasCode && !hasFile) {
      alert("Please either paste code or upload a file");
      return;
    }

    // Create new abort controller
    const controller = new AbortController();
    setAbortController(controller);

    const body = new FormData();
    body.append("model", model);
    body.append("explanation", explanation.trim()); // NEW: Add explanation to request

    if (hasCode) body.append("code", code);
    if (hasFile) body.append("file", file);

    setLoading(true);
    setTypedText("");
    setResult(null);
    setStreamingStatus("Initializing test generation...");

    try {
      // NEW: Simulate streaming status updates
      const statusUpdates = [
        "Analyzing function code...",
        "Understanding function behavior...",
        "Generating test scenarios...",
        "Creating test cases...",
        "Validating test syntax...",
        "Running generated tests...",
        "Finalizing results..."
      ];

      let statusIndex = 0;
      const statusInterval = setInterval(() => {
        if (statusIndex < statusUpdates.length - 1) {
          statusIndex++;
          setStreamingStatus(statusUpdates[statusIndex]);
        }
      }, 2000);

      const res = await fetch("/api/generate-tests", { 
        method: "POST", 
        body,
        signal: controller.signal // NEW: Add abort signal
      });
      
      clearInterval(statusInterval);
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const json = await res.json();
      setResult(json);

      if (json.testCode) {
        setStreamingStatus("Displaying generated tests...");
        await typeText(json.testCode);
      }
      
      setStreamingStatus("");
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was aborted - result already set in handleStop
        return;
      }
      
      setResult({
        ok: false,
        error: "Failed to generate tests. Please try again.",
        output: "Could not complete test execution",
      });
      setStreamingStatus("");
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const toggleDark = () => setDark(!dark);
  const theme = dark ? "dark" : "light";

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    if (e.target.value.trim() && file) setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile && code.trim()) setCode("");
  };

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [result]);

  const canSubmit = !loading && !isTyping && (code.trim() || file);
  const canStop = loading || isTyping;

  return (
    <main
      className={`${theme} bg-gray-100 dark:bg-gray-900 min-h-screen p-4 sm:p-8 flex flex-col items-center font-sans transition-colors duration-300`}
    >
      <button
        onClick={toggleDark}
        className="absolute top-4 right-4 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        {dark ? "💡 Light" : "🌙 Dark"}
      </button>

      <div className="w-full max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">
          AI Unit-Test Generator
        </h1>

        {/* Model Selection */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Select AI Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={loading}
            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {model === "gemini"
              ? "Using Google's Gemini model"
              : "Using OpenRouter API with selected model"}
          </p>
        </div>

        {/* Code Input Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Option 1: Paste TypeScript Function
              </label>
              <textarea
                value={code}
                onChange={handleCodeChange}
                disabled={loading}
                placeholder="function factorial(n: number): number {
  if (n < 0) throw new Error('Negative not allowed');
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}"
                className="w-full h-40 p-3 border rounded-lg resize-none bg-white dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 transition-colors font-mono text-sm disabled:opacity-50"
              />
              {code.trim() && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ Code ready to test
                </p>
              )}
            </div>

            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
              <span className="px-4 text-sm font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Option 2: Upload TypeScript File
              </label>
              <input
                type="file"
                accept=".ts,.tsx,.js,.jsx"
                onChange={handleFileChange}
                disabled={loading}
                className="block w-full text-sm text-gray-700 dark:text-gray-200 
                          file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                          file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 
                          file:text-blue-700 dark:file:text-blue-200 
                          hover:file:bg-blue-100 dark:hover:file:bg-blue-800 transition-colors
                          disabled:opacity-50"
              />
              {file && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  ✓ File selected: {file.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* NEW: Function Explanation Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Function Explanation (Optional but Recommended)
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            disabled={loading}
            placeholder="Explain what your function does, its purpose, expected behavior, and any special requirements. For example:

'This function calculates the factorial of a positive integer. It should return 1 for input 0, throw an error for negative numbers, and handle edge cases properly. The function is used in mathematical calculations where factorial computation is needed.'"
            className="w-full h-32 p-3 border rounded-lg resize-none bg-white dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 transition-colors text-sm disabled:opacity-50"
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            💡 Providing an explanation helps the AI generate more accurate and comprehensive tests
          </p>
          {explanation.trim() && (
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
              ✓ Explanation provided ({explanation.trim().length} characters)
            </p>
          )}
        </div>

        {code.trim() && file && (
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Note:</strong> Since you have both pasted code and a
              file, the pasted code will be used for testing.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg 
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-colors"
          >
            {loading
              ? "Generating Tests…"
              : isTyping
              ? "Displaying Results…"
              : "Generate & Test"}
          </button>
          
          {/* NEW: Stop Button */}
          {canStop && (
            <button
              onClick={handleStop}
              className="py-3 px-6 bg-red-600 text-white font-semibold rounded-lg 
                         hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <span className="w-4 h-4 border-2 border-white rounded-sm"></span>
              Stop
            </button>
          )}
        </div>

        {!canSubmit && !loading && !isTyping && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Please paste code or upload a file to get started
          </p>
        )}

        {/* NEW: Streaming Status */}
        {(loading || isTyping) && (
          <div className="flex justify-center items-center mt-4 space-x-2">
            <div className="w-6 h-6 border-4 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 dark:text-gray-300">
              {streamingStatus || (loading ? "Generating tests..." : "Displaying results...")}
            </span>
          </div>
        )}

        <div ref={resultsRef} className="space-y-4">
          {result && (
            <>
              {result.ok ? (
                <>
                  <h2 className="text-xl font-bold text-green-600 dark:text-green-400">
                    ✅ Tests Generated and Passed!
                  </h2>
                  <div className="relative">
                    <pre className="bg-gray-800 text-green-300 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap font-mono max-h-96">
                      {typedText}
                      {(isTyping || loading) && (
                        <span className="ml-1 inline-block w-2 h-5 bg-green-400 animate-pulse"></span>
                      )}
                    </pre>
                    {!isTyping && (
                      <button
                        onClick={() => navigator.clipboard.writeText(typedText)}
                        className="absolute top-2 right-2 p-2 bg-gray-700 rounded text-xs text-white hover:bg-gray-600 transition-colors"
                        title="Copy to clipboard"
                      >
                        📋 Copy
                      </button>
                    )}
                  </div>
                  {!isTyping && result.jestOutput && (
                    <details className="mt-4">
                      <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                        View Jest Test Output
                      </summary>
                      <pre className="mt-2 bg-gray-900 text-gray-200 p-3 rounded text-xs overflow-auto max-h-64">
                        {result.jestOutput}
                      </pre>
                    </details>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                    ❌ Test Generation Failed
                  </h2>
                  {result.error && (
                    <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                        Error Details
                      </h3>
                      <div className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
                        {result.error}
                      </div>
                    </div>
                  )}
                  {result.output && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                        Test Summary
                      </h3>
                      <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                        {result.output}
                      </pre>
                    </div>
                  )}
                  {result.fix && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        💡 AI Fix Suggestions
                      </h3>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300 whitespace-pre-wrap">
                        {result.fix}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}