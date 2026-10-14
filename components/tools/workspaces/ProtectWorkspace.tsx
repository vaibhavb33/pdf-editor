"use client";

import React, { useState } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createDownloadBlob } from "@/lib/pdf/types";

export function ProtectWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);

  const { toast } = useToast();

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setError(null);
    }
  };

  const handleProtect = async () => {
    if (!file) return;

    if (!password) {
      toast.warning("Enter Password", "Please provide a password to protect the document.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password Mismatch", "Passwords do not match. Please retype carefully.");
      return;
    }

    setIsProcessing(true);
    setProgress(20);
    setStage("Applying cryptographic protection locks client-side...");
    setError(null);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());

      const { protectPdf } = await import("@/lib/pdf/protect");
      const res = await protectPdf({
        fileData: buffer,
        userPassword: password,
        outputFilename: `protected-${file.name}`,
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      if (!res.data) throw new Error("No data returned from protection.");

      const blob = createDownloadBlob(res.data, "application/pdf");
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        size: blob.size,
        name: res.filename,
      });

      toast.success("Document Encrypted", "PDF password-protected with zero server transmission!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to encrypt PDF.";
      setError(msg);
      toast.error("Protection Failed", msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setPassword("");
    setConfirmPassword("");
    setResult(null);
    setError(null);
    setProgress(0);
  };

  if (result) {
    return (
      <ResultCard
        filename={result.name}
        filesize={result.size}
        originalSize={file?.size}
        downloadUrl={result.url}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <Dropzone
          onFilesSelected={handleFiles}
          acceptedTypes={[".pdf", "application/pdf"]}
          maxFiles={1}
          errorMessage={error}
          onClearError={() => setError(null)}
        />
      ) : (
        <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div>
              <h4 className="max-w-xs truncate text-sm font-bold text-zinc-900 sm:max-w-md dark:text-zinc-100">
                {file.name}
              </h4>
              <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[44px] cursor-pointer px-3 text-xs font-semibold text-zinc-500 transition-colors hover:text-rose-600"
            >
              Change file
            </button>
          </div>

          <div className="max-w-md space-y-4">
            <div>
              <label
                htmlFor="protect-pw"
                className="mb-1.5 block text-xs font-semibold tracking-wider text-zinc-500 uppercase"
              >
                Set Document Password
              </label>
              <div className="relative">
                <input
                  id="protect-pw"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  className="min-h-[48px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 pr-16 text-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex min-h-[44px] cursor-pointer items-center pr-3 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-pw"
                className="mb-1.5 block text-xs font-semibold tracking-wider text-zinc-500 uppercase"
              >
                Confirm Password
              </label>
              <input
                id="confirm-pw"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="min-h-[48px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <p className="text-[11px] leading-relaxed text-zinc-500">
              Passwords are never transmitted to our servers. Be sure to remember your password, as
              locked files cannot be recovered without it.
            </p>
          </div>

          {isProcessing && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <ProgressBar progress={progress} stage={stage} />
            </div>
          )}

          {!isProcessing && (
            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={handleProtect} className="min-h-[48px] px-8">
                Protect & Encrypt PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
