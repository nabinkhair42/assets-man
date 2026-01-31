"use client";

import { useState, useEffect } from "react";
import { FileText, FileCode, FileSpreadsheet, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/formatters";
import type { PreviewComponentProps } from "./types";

interface TextPreviewProps extends PreviewComponentProps {
  className?: string;
  // Controlled mode props (used when minimal=true)
  minimal?: boolean;
  onContentLoad?: (content: string) => void;
}

export function TextPreview({
  asset,
  previewUrl,
  onDownload,
  className,
  minimal = false,
  onContentLoad,
}: TextPreviewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Determine file type
  const isJson = asset.mimeType === "application/json";
  const isCsv = asset.mimeType.includes("csv");

  // Check file extension for code files (handles MDX, TSX, JSX, etc.)
  const fileExt = asset.name.toLowerCase().substring(asset.name.lastIndexOf("."));
  const codeExtensions = [
    ".mdx", ".tsx", ".jsx", ".ts", ".js", ".json",
    ".yaml", ".yml", ".toml", ".xml", ".html", ".css", ".scss", ".less",
    ".py", ".rb", ".go", ".rs", ".java", ".kt", ".swift", ".c", ".cpp", ".h",
    ".sh", ".bash", ".zsh", ".ps1", ".sql", ".graphql", ".vue", ".svelte",
  ];
  const isCodeByExtension = codeExtensions.includes(fileExt);

  const isCode = isCodeByExtension ||
    asset.mimeType === "application/json" ||
    asset.mimeType === "application/javascript" ||
    asset.mimeType === "application/typescript" ||
    asset.mimeType === "application/xml" ||
    asset.mimeType === "application/x-yaml" ||
    asset.mimeType === "application/x-sh";

  // Fetch text content
  useEffect(() => {
    let cancelled = false;

    async function fetchContent() {
      setLoading(true);
      setError(null);
      setContent(null);

      try {
        const response = await fetch(previewUrl);
        if (!response.ok) throw new Error("Failed to fetch content");
        const text = await response.text();
        if (!cancelled) {
          // Limit content size for performance
          const truncatedContent = text.slice(0, 500000);
          setContent(truncatedContent);
          onContentLoad?.(truncatedContent);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load file content");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchContent();
    return () => { cancelled = true; };
  }, [previewUrl, asset.id, onContentLoad]);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore copy errors
    }
  };

  // Get appropriate icon
  const FileIcon = isCsv ? FileSpreadsheet : isCode ? FileCode : FileText;
  const iconColor = isCsv ? "text-emerald-500" : isCode ? "text-yellow-500" : "text-orange-500";

  // Loading state
  if (loading) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center gap-4",
        minimal ? "text-white/60" : "text-muted-foreground",
        className
      )}>
        <div className="relative">
          <div className={cn(
            "h-16 w-16 rounded-full border-4",
            minimal ? "border-white/20" : "border-border"
          )} />
          <div className={cn(
            "absolute inset-0 h-16 w-16 rounded-full border-4 border-r-transparent border-b-transparent border-l-transparent animate-spin",
            minimal ? "border-t-white/60" : "border-t-primary"
          )} />
        </div>
        <p className="text-sm">Loading content...</p>
      </div>
    );
  }

  // Error state
  if (error || !content) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-6", className)}>
        <div className={cn(
          "p-8 rounded-2xl",
          minimal ? "bg-background/5" : "bg-muted/50"
        )}>
          <FileIcon className={cn("h-24 w-24", iconColor)} />
        </div>
        <div className="text-center">
          <p className={cn(
            "font-medium mb-1",
            minimal ? "text-white/80" : "text-foreground/80"
          )}>{asset.name}</p>
          <p className={cn(
            "text-sm mb-4",
            minimal ? "text-white/60" : "text-muted-foreground"
          )}>{error || "Could not load content"}</p>
        </div>
        <Button onClick={onDownload} variant={minimal ? "secondary" : "default"}>
          <Download className="mr-2 h-4 w-4" />
          Download to view
        </Button>
      </div>
    );
  }

  // CSV table view
  if (isCsv) {
    return <CsvPreview content={content} asset={asset} onDownload={onDownload} className={className} minimal={minimal} />;
  }

  // JSON formatted view
  if (isJson) {
    let formattedJson = content;
    try {
      formattedJson = JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      // Use raw content if parsing fails
    }

    // Minimal mode - just content, no toolbar
    if (minimal) {
      return (
        <div className={cn("flex flex-col w-full max-w-4xl h-full", className)}>
          <div className="flex-1 overflow-auto rounded-lg bg-secondary border min-h-0" style={{ maxHeight: "calc(100vh - 120px)" }}>
            <pre className="p-4 text-sm text-green-400 font-mono whitespace-pre-wrap break-all">
              {formattedJson}
            </pre>
          </div>
        </div>
      );
    }

    // Full mode with toolbar
    return (
      <div className={cn("flex flex-col w-full max-w-4xl h-full", className)}>
        <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-t-lg border border-border border-b-0">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-yellow-500" />
            <span className="text-foreground/80 text-sm font-medium truncate max-w-xs">{asset.name}</span>
            <span className="text-muted-foreground text-xs">{formatFileSize(asset.size)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={onDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto rounded-b-lg bg-card border border-border min-h-0" style={{ maxHeight: "calc(100vh - 200px)" }}>
          <pre className="p-4 text-sm text-green-600 dark:text-green-400 font-mono whitespace-pre-wrap break-all">
            {formattedJson}
          </pre>
        </div>
      </div>
    );
  }

  // Plain text view - Minimal mode
  if (minimal) {
    return (
      <div className={cn("flex flex-col w-full max-w-4xl h-full", className)}>
        <div className="flex-1 overflow-auto rounded-lg bg-secondary border border min-h-0" style={{ maxHeight: "calc(100vh - 120px)" }}>
          <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">
            {content}
          </pre>
        </div>
      </div>
    );
  }

  // Plain text view - Full mode with toolbar
  return (
    <div className={cn("flex flex-col w-full max-w-4xl h-full", className)}>
      <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-t-lg border border-border border-b-0">
        <div className="flex items-center gap-2">
          <FileIcon className={cn("h-4 w-4", iconColor)} />
          <span className="text-foreground/80 text-sm font-medium truncate max-w-xs">{asset.name}</span>
          <span className="text-muted-foreground text-xs">{formatFileSize(asset.size)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto rounded-b-lg bg-card border border-border min-h-0" style={{ maxHeight: "calc(100vh - 200px)" }}>
        <pre className="p-4 text-sm text-foreground/80 font-mono whitespace-pre-wrap break-all">
          {content}
        </pre>
      </div>
    </div>
  );
}

// CSV Preview subcomponent
function CsvPreview({
  content,
  asset,
  onDownload,
  className,
  minimal = false,
}: {
  content: string;
  asset: PreviewComponentProps["asset"];
  onDownload: () => void;
  className?: string;
  minimal?: boolean;
}) {
  const lines = content.split("\n").filter(line => line.trim());
  const rows = lines.slice(0, 100).map(line => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });
  const hasMoreRows = lines.length > 100;

  // Minimal mode - just table, no toolbar
  if (minimal) {
    return (
      <div className={cn("flex flex-col w-full max-w-5xl h-full", className)}>
        <div className="flex-1 overflow-auto rounded-lg bg- border border-white/10 min-h-0" style={{ maxHeight: "calc(100vh - 120px)" }}>
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-gray-800 text-white/80 text-xs">
              <tr>
                {rows[0]?.map((cell, i) => (
                  <th key={i} className="px-4 py-3 font-medium border-b border-white/10 whitespace-nowrap">
                    {cell || `Column ${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-white/70">
              {rows.slice(1).map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2 whitespace-nowrap max-w-xs truncate">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {hasMoreRows && (
            <div className="px-4 py-3 text-white/50 text-xs text-center border-t border-white/10 bg-gray-800/50">
              Showing first 100 rows of {lines.length} total
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full mode with toolbar
  return (
    <div className={cn("flex flex-col w-full max-w-5xl h-full", className)}>
      <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-t-lg border border-border border-b-0">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
          <span className="text-foreground/80 text-sm font-medium truncate max-w-xs">{asset.name}</span>
          <span className="text-muted-foreground text-xs">{formatFileSize(asset.size)}</span>
          <span className="text-muted-foreground/60 text-xs">• {lines.length} rows</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={onDownload}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto rounded-b-lg bg-card border border-border min-h-0" style={{ maxHeight: "calc(100vh - 200px)" }}>
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-muted text-foreground/80 text-xs">
            <tr>
              {rows[0]?.map((cell, i) => (
                <th key={i} className="px-4 py-3 font-medium border-b border-border whitespace-nowrap">
                  {cell || `Column ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-foreground/70">
            {rows.slice(1).map((row, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-accent/50">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2 whitespace-nowrap max-w-xs truncate">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {hasMoreRows && (
          <div className="px-4 py-3 text-muted-foreground text-xs text-center border-t border-border bg-muted/50">
            Showing first 100 rows of {lines.length} total
          </div>
        )}
      </div>
    </div>
  );
}
