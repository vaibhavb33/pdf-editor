"use client";

import dynamic from "next/dynamic";
import React from "react";

function WorkspaceSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[320px] w-full animate-pulse flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center sm:p-12 dark:border-zinc-800 dark:bg-zinc-900/30"
    >
      <div className="mb-4 h-12 w-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="mb-2 h-5 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-72 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
      <span className="sr-only">Loading tool workspace...</span>
    </div>
  );
}

const MergeWorkspace = dynamic(
  () => import("./workspaces/MergeWorkspace").then((mod) => mod.MergeWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);
const SplitWorkspace = dynamic(
  () => import("./workspaces/SplitWorkspace").then((mod) => mod.SplitWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);
const CompressWorkspace = dynamic(
  () => import("./workspaces/CompressWorkspace").then((mod) => mod.CompressWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);
const RotateWorkspace = dynamic(
  () => import("./workspaces/RotateWorkspace").then((mod) => mod.RotateWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);
const DeletePagesWorkspace = dynamic(
  () => import("./workspaces/DeletePagesWorkspace").then((mod) => mod.DeletePagesWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);
const OrganizeWorkspace = dynamic(
  () => import("./workspaces/OrganizeWorkspace").then((mod) => mod.OrganizeWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);
const PdfToImagesWorkspace = dynamic(
  () => import("./workspaces/PdfToImagesWorkspace").then((mod) => mod.PdfToImagesWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);
const ImagesToPdfWorkspace = dynamic(
  () => import("./workspaces/ImagesToPdfWorkspace").then((mod) => mod.ImagesToPdfWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);
const WatermarkWorkspace = dynamic(
  () => import("./workspaces/WatermarkWorkspace").then((mod) => mod.WatermarkWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);
const PageNumbersWorkspace = dynamic(
  () => import("./workspaces/PageNumbersWorkspace").then((mod) => mod.PageNumbersWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);
const SignWorkspace = dynamic(
  () => import("./workspaces/SignWorkspace").then((mod) => mod.SignWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);
const ProtectWorkspace = dynamic(
  () => import("./workspaces/ProtectWorkspace").then((mod) => mod.ProtectWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);
const UnlockWorkspace = dynamic(
  () => import("./workspaces/UnlockWorkspace").then((mod) => mod.UnlockWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);
const EditWorkspace = dynamic(
  () => import("./workspaces/EditWorkspace").then((mod) => mod.EditWorkspace),
  { loading: () => <WorkspaceSkeleton /> }
);

interface ToolWorkspaceControllerProps {
  slug: string;
}

export function ToolWorkspaceController({ slug }: ToolWorkspaceControllerProps) {
  switch (slug) {
    case "merge-pdf":
      return <MergeWorkspace />;
    case "split-pdf":
      return <SplitWorkspace />;
    case "compress-pdf":
      return <CompressWorkspace />;
    case "rotate-pdf":
      return <RotateWorkspace />;
    case "delete-pages":
      return <DeletePagesWorkspace />;
    case "organize-pdf":
      return <OrganizeWorkspace />;
    case "pdf-to-jpg":
      return <PdfToImagesWorkspace />;
    case "jpg-to-pdf":
      return <ImagesToPdfWorkspace />;
    case "watermark-pdf":
      return <WatermarkWorkspace />;
    case "page-numbers":
    case "page-numbers-pdf":
      return <PageNumbersWorkspace />;
    case "sign-pdf":
      return <SignWorkspace />;
    case "protect-pdf":
      return <ProtectWorkspace />;
    case "unlock-pdf":
      return <UnlockWorkspace />;
    case "edit-pdf":
      return <EditWorkspace />;
    default:
      return <MergeWorkspace />;
  }
}
