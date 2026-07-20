import React, { useState, useEffect } from "react";
import { 
  Terminal, X, Trash2, ChevronRight, ChevronDown, CheckCircle2, 
  XCircle, Copy, Check, ShieldAlert, Play, RefreshCw, Layers
} from "lucide-react";
import { AureliusLogger, LogEntry } from "../utils/AureliusLogger";

export default function AureliusDebugConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "success" | "error">("all");
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    // Subscribe to AureliusLogger updates
    const unsubscribe = AureliusLogger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsubscribe();
  }, []);

  const handleClear = () => {
    AureliusLogger.clearLogs();
    setSelectedLogId(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyRaw = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (activeTab === "success") return log.type === "success";
    if (activeTab === "error") return log.type === "error";
    return true;
  });

  const selectedLog = logs.find((l) => l.id === selectedLogId);

  // Quick test triggers
  const triggerHealthCheck = async () => {
    try {
      const res = await fetch("/api/health");
      const contentType = res.headers.get("content-type") || "";
      let parsed;
      if (res.status !== 204 && contentType.includes("application/json")) {
        parsed = await res.json();
      } else {
        parsed = await res.text();
      }
      AureliusLogger.log({
        type: "success",
        url: "/api/health",
        method: "GET",
        status: res.status,
        responseBody: parsed
      });
    } catch (e: any) {
      AureliusLogger.log({
        type: "error",
        url: "/api/health",
        method: "GET",
        status: 500,
        error: e.message,
        stack: e.stack
      });
    }
  };

  const triggerProductsFetch = async () => {
    try {
      const res = await fetch("/api/products");
      const contentType = res.headers.get("content-type") || "";
      let parsed;
      if (res.status !== 204 && contentType.includes("application/json")) {
        parsed = await res.json();
      } else {
        parsed = await res.text();
      }
      
      if (res.ok) {
        AureliusLogger.log({
          type: "success",
          url: "/api/products",
          method: "GET",
          status: res.status,
          responseBody: parsed
        });
      } else {
        AureliusLogger.log({
          type: "error",
          url: "/api/products",
          method: "GET",
          status: res.status,
          error: "API returned error code",
          responseBody: parsed
        });
      }
    } catch (e: any) {
      AureliusLogger.log({
        type: "error",
        url: "/api/products",
        method: "GET",
        status: 500,
        error: e.message,
        stack: e.stack
      });
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-4 z-40 bg-[#111111] hover:bg-[#1A1A1A] text-[#C5A05A] border border-[#C5A05A]/40 hover:border-[#C5A05A] px-3 py-2 rounded-full flex items-center space-x-1.5 shadow-lg text-[10px] font-mono tracking-widest uppercase transition-all duration-300"
        title="Open Aurelius Trace Log Console"
      >
        <Terminal className="h-3.5 w-3.5 animate-pulse text-[#C5A05A]" />
        <span>Trace Log {logs.length > 0 && `(${logs.length})`}</span>
      </button>

      {/* Main Slide-out Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-4xl bg-[#111111] h-full border-l border-gray-800 flex flex-col font-sans text-gray-300 shadow-2xl">
            
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#151515]">
              <div className="flex items-center space-x-2">
                <Terminal className="h-5 w-5 text-[#C5A05A]" />
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono">
                    AURELIUS DEPLOYMENT INTERCEPTOR
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono">
                    Development Stage Proxy & Database Write Tracer
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleClear}
                  disabled={logs.length === 0}
                  className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 px-2 py-1.5 rounded disabled:opacity-40 disabled:pointer-events-none transition-colors border border-transparent hover:border-red-900/30 font-mono uppercase text-[9px] tracking-wider"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear Logs</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Test Console Row */}
            <div className="bg-[#1C1C1C] px-4 py-2 border-b border-gray-800 flex flex-wrap items-center gap-2.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500">
                Diagnostic Stimuli:
              </span>
              <button
                onClick={triggerHealthCheck}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-2 py-1 rounded text-[9px] font-mono flex items-center space-x-1 uppercase tracking-wider transition-colors"
              >
                <Play className="h-2.5 w-2.5 text-green-400" />
                <span>Test Health Endpoint</span>
              </button>
              <button
                onClick={triggerProductsFetch}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-2 py-1 rounded text-[9px] font-mono flex items-center space-x-1 uppercase tracking-wider transition-colors"
              >
                <RefreshCw className="h-2.5 w-2.5 text-[#C5A05A]" />
                <span>Simulate /api/products GET</span>
              </button>
            </div>

            {/* Main Workspace: Columns Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
              
              {/* Left Column: Log Listings (Span 5) */}
              <div className="md:col-span-5 border-r border-gray-800 flex flex-col overflow-hidden h-full">
                
                {/* Tabs */}
                <div className="flex border-b border-gray-800 bg-[#161616]">
                  <button
                    onClick={() => { setActiveTab("all"); setSelectedLogId(null); }}
                    className={`flex-1 py-2 text-center text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all ${
                      activeTab === "all" 
                        ? "border-[#C5A05A] text-white bg-[#1A1A1A]" 
                        : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    All ({logs.length})
                  </button>
                  <button
                    onClick={() => { setActiveTab("success"); setSelectedLogId(null); }}
                    className={`flex-1 py-2 text-center text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all ${
                      activeTab === "success" 
                        ? "border-green-500 text-green-400 bg-green-950/10" 
                        : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Success ({logs.filter(l => l.type === "success").length})
                  </button>
                  <button
                    onClick={() => { setActiveTab("error"); setSelectedLogId(null); }}
                    className={`flex-1 py-2 text-center text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all ${
                      activeTab === "error" 
                        ? "border-red-500 text-red-400 bg-red-950/10" 
                        : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Errors ({logs.filter(l => l.type === "error").length})
                  </button>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-900 bg-[#121212]">
                  {filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-gray-600 font-mono text-xs">
                      <Layers className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                      No interceptor records in filter buffer
                    </div>
                  ) : (
                    filteredLogs.map((log) => {
                      const isSelected = log.id === selectedLogId;
                      const isErr = log.type === "error";
                      const timeStr = new Date(log.timestamp).toLocaleTimeString();

                      return (
                        <div
                          key={log.id}
                          onClick={() => setSelectedLogId(log.id)}
                          className={`p-3 text-left cursor-pointer transition-colors select-none ${
                            isSelected 
                              ? "bg-neutral-800 text-white" 
                              : isErr 
                                ? "bg-red-950/5 hover:bg-red-950/10 text-red-200"
                                : "hover:bg-neutral-900"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono text-gray-500">
                              {timeStr}
                            </span>
                            <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                              isErr 
                                ? "bg-red-950 text-red-400 border border-red-900/40" 
                                : "bg-green-950 text-green-400 border border-green-900/40"
                            }`}>
                              {log.status || (isErr ? "FAIL" : "200")}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {isErr ? (
                              <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            )}
                            <span className="font-mono text-xs font-bold uppercase shrink-0 w-10">
                              {log.method}
                            </span>
                            <span className="font-mono text-xs truncate flex-1 text-gray-300">
                              {log.url}
                            </span>
                          </div>

                          {log.error && (
                            <p className="text-[9px] text-red-400 font-mono mt-1.5 truncate border-t border-red-950 pt-1">
                              ⚠️ {log.error}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Detailed Inspector (Span 7) */}
              <div className="md:col-span-7 flex flex-col overflow-hidden h-full bg-[#141414]">
                {selectedLog ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    
                    {/* Header bar of details */}
                    <div className="p-3 border-b border-gray-800 bg-[#1A1A1A] flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${selectedLog.type === "error" ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
                        <span className="font-mono text-xs font-bold text-white uppercase">
                          Transaction Inspector
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-gray-500">
                        ID: {selectedLog.id}
                      </span>
                    </div>

                    {/* Detailed Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      
                      {/* Overview Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#111111] p-2.5 border border-gray-800 rounded">
                          <p className="text-[9px] text-gray-500 uppercase font-mono tracking-widest">HTTP Method</p>
                          <p className="text-sm text-white font-mono font-bold mt-0.5">{selectedLog.method}</p>
                        </div>
                        <div className="bg-[#111111] p-2.5 border border-gray-800 rounded">
                          <p className="text-[9px] text-gray-500 uppercase font-mono tracking-widest">HTTP Status</p>
                          <p className={`text-sm font-mono font-bold mt-0.5 ${selectedLog.type === "error" ? "text-red-400" : "text-green-400"}`}>
                            {selectedLog.status || "UNKNOWN"}
                          </p>
                        </div>
                        <div className="col-span-2 bg-[#111111] p-2.5 border border-gray-800 rounded">
                          <p className="text-[9px] text-gray-500 uppercase font-mono tracking-widest">Target Endpoint</p>
                          <p className="text-xs text-[#C5A05A] font-mono mt-0.5 break-all">{selectedLog.url}</p>
                        </div>
                        <div className="col-span-2 bg-[#111111] p-2.5 border border-gray-800 rounded">
                          <p className="text-[9px] text-gray-500 uppercase font-mono tracking-widest">Timestamp</p>
                          <p className="text-xs text-gray-300 font-mono mt-0.5">
                            {new Date(selectedLog.timestamp).toLocaleString()} ({selectedLog.timestamp})
                          </p>
                        </div>
                      </div>

                      {/* Error Banner if Error */}
                      {selectedLog.error && (
                        <div className="bg-red-950/20 border border-red-900/40 p-3 rounded">
                          <div className="flex items-start space-x-2">
                            <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[9px] text-red-400 uppercase font-mono tracking-widest font-semibold">
                                Error Descriptor
                              </p>
                              <p className="text-xs text-red-200 font-mono mt-1 whitespace-pre-wrap">
                                {selectedLog.error}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stack Trace if exists */}
                      {selectedLog.stack && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-mono tracking-widest text-red-400 font-semibold">
                              Client Stack Trace
                            </span>
                            <button
                              onClick={() => handleCopy(selectedLog.stack || "", "stack")}
                              className="text-[9px] font-mono text-gray-500 hover:text-white flex items-center space-x-1 bg-neutral-800 px-1.5 py-0.5 rounded"
                            >
                              {copiedId === "stack" ? <Check className="h-2.5 w-2.5 text-green-400" /> : <Copy className="h-2.5 w-2.5" />}
                              <span>{copiedId === "stack" ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                          <pre className="p-3 bg-[#0c0c0c] border border-red-900/20 rounded font-mono text-[9px] text-red-300/80 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre">
                            {selectedLog.stack}
                          </pre>
                        </div>
                      )}

                      {/* Outgoing Request Payload */}
                      {selectedLog.payload && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">
                              Request Payload (JSON / FormData)
                            </span>
                            <button
                              onClick={() => handleCopy(JSON.stringify(selectedLog.payload, null, 2), "payload")}
                              className="text-[9px] font-mono text-gray-500 hover:text-white flex items-center space-x-1 bg-neutral-800 px-1.5 py-0.5 rounded"
                            >
                              {copiedId === "payload" ? <Check className="h-2.5 w-2.5 text-green-400" /> : <Copy className="h-2.5 w-2.5" />}
                              <span>{copiedId === "payload" ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                          <pre className="p-3 bg-[#0c0c0c] border border-gray-800 rounded font-mono text-[10px] text-neutral-300 overflow-x-auto max-h-56 overflow-y-auto whitespace-pre">
                            {JSON.stringify(selectedLog.payload, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* HTTP Response Headers */}
                      {selectedLog.headers && Object.keys(selectedLog.headers).length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 block">
                            Response Headers
                          </span>
                          <div className="p-3 bg-[#0c0c0c] border border-gray-800 rounded font-mono text-[9px] text-gray-400 space-y-1 overflow-x-auto">
                            {Object.entries(selectedLog.headers).map(([k, v]) => (
                              <div key={k} className="flex">
                                <span className="text-[#C5A05A] font-semibold select-all shrink-0 mr-2">{k}:</span>
                                <span className="text-gray-300 select-all break-all">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Response Body */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400">
                            Server Response Body
                          </span>
                          <button
                            onClick={() => handleCopy(
                              typeof selectedLog.responseBody === "string" 
                                ? selectedLog.responseBody 
                                : JSON.stringify(selectedLog.responseBody, null, 2), 
                              "response"
                            )}
                            className="text-[9px] font-mono text-gray-500 hover:text-white flex items-center space-x-1 bg-neutral-800 px-1.5 py-0.5 rounded"
                          >
                            {copiedId === "response" ? <Check className="h-2.5 w-2.5 text-green-400" /> : <Copy className="h-2.5 w-2.5" />}
                            <span>{copiedId === "response" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <pre className="p-3 bg-[#0c0c0c] border border-gray-800 rounded font-mono text-[10px] text-neutral-200 overflow-x-auto max-h-80 overflow-y-auto whitespace-pre">
                          {typeof selectedLog.responseBody === "string" 
                            ? selectedLog.responseBody 
                            : JSON.stringify(selectedLog.responseBody, null, 2)
                          }
                        </pre>
                      </div>

                    </div>

                    {/* Copy entire transaction helper */}
                    <div className="p-3 bg-[#151515] border-t border-gray-800 flex justify-between items-center">
                      <span className="text-[9px] font-mono text-gray-500">
                        Format: Full Intercept Object (Vite Ported)
                      </span>
                      <button
                        onClick={() => handleCopyRaw(JSON.stringify(selectedLog, null, 2))}
                        className="bg-[#C5A05A] hover:bg-[#A5673F] text-black hover:text-white py-1 px-3 rounded text-[9px] font-mono tracking-wider font-semibold uppercase flex items-center space-x-1 transition-colors"
                      >
                        {copiedText ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedText ? "Entire Trace Copied!" : "Copy Full Trace JSON"}</span>
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-600 font-mono">
                    <Terminal className="h-10 w-10 text-neutral-700 mb-2 animate-pulse" />
                    <p className="text-xs">Select any network log transaction in the intercept stream to load its telemetry variables</p>
                    <p className="text-[9px] text-neutral-700 mt-1 uppercase tracking-widest">Active Listening Loop Online</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
