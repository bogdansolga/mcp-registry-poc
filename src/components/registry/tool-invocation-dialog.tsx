"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Tool {
  id: number;
  serverId: number;
  name: string;
  description: string | null;
  inputSchema: Record<string, unknown> | null;
  category: string | null;
}

interface ToolInvocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tool: Tool;
  serverId: number;
}

interface InvocationResult {
  success: boolean;
  result?: unknown;
  error?: string;
  code?: string;
  duration_ms?: number;
}

export function ToolInvocationDialog({ isOpen, onClose, tool, serverId }: ToolInvocationDialogProps) {
  const [argumentsText, setArgumentsText] = useState("{}");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InvocationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setArgumentsText("{}");
    setResult(null);
    setValidationError(null);
    onClose();
  }, [onClose]);

  const validateJson = useCallback((text: string): boolean => {
    try {
      JSON.parse(text);
      setValidationError(null);
      return true;
    } catch (e) {
      setValidationError(`Invalid JSON: ${(e as Error).message}`);
      return false;
    }
  }, []);

  const handleInvoke = useCallback(async () => {
    if (!validateJson(argumentsText)) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/proxy/invoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("admin:password"),
        },
        body: JSON.stringify({
          server_id: serverId,
          tool_name: tool.name,
          arguments: JSON.parse(argumentsText),
        }),
      });

      const data: InvocationResult = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        code: "NETWORK_ERROR",
      });
    } finally {
      setIsLoading(false);
    }
  }, [argumentsText, serverId, tool.name, validateJson]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />

      {/* Modal */}
      <div className="relative bg-background rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Invoke Tool: {tool.name}</h2>
          {tool.description && <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>}
        </div>

        {/* Input Schema Reference */}
        {tool.inputSchema && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              View input schema
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs max-h-40">
              {JSON.stringify(tool.inputSchema, null, 2)}
            </pre>
          </details>
        )}

        {/* Arguments Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Arguments (JSON)</label>
          <Textarea
            value={argumentsText}
            onChange={(e) => {
              setArgumentsText(e.target.value);
              if (validationError) {
                validateJson(e.target.value);
              }
            }}
            placeholder="{}"
            className="font-mono text-sm min-h-[120px]"
            disabled={isLoading}
          />
          {validationError && <p className="text-sm text-destructive mt-1">{validationError}</p>}
        </div>

        {/* Result Display */}
        {result && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Result</label>
            <div
              className={`rounded p-3 text-sm ${
                result.success
                  ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800"
                  : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
              }`}
            >
              {result.success ? (
                <>
                  <div className="text-green-700 dark:text-green-300 font-medium mb-2">
                    Success
                    {result.duration_ms !== undefined && (
                      <span className="font-normal text-xs ml-2">({result.duration_ms}ms)</span>
                    )}
                  </div>
                  <pre className="overflow-auto text-xs bg-white/50 dark:bg-black/20 rounded p-2 max-h-40">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </>
              ) : (
                <>
                  <div className="text-red-700 dark:text-red-300 font-medium mb-1">
                    Error{result.code && ` (${result.code})`}
                  </div>
                  <p className="text-red-600 dark:text-red-400">{result.error}</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleInvoke} disabled={isLoading}>
            {isLoading ? "Invoking..." : "Invoke"}
          </Button>
        </div>
      </div>
    </div>
  );
}
