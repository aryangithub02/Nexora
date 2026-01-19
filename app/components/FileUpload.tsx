"use client";

import { uploadFiles } from "@/lib/uploadthing";
import { Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { ClientUploadedFileData } from "uploadthing/types";

interface FileUploadProps {
  onSuccess: (res: ClientUploadedFileData<any>) => void;
  onProgress?: (progress: number) => void;
  fileType?: "image" | "video";
}

export default function FileUpload({
  onSuccess,
  onProgress,
  fileType = "image",
}: FileUploadProps) {
  const [localProgress, setLocalProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setError(null);
        const files = Array.from(e.target.files);

        const file = files[0];
        if (fileType === "video" && !file.type.startsWith("video/")) {
          setError("Please upload a valid video file.");
          return;
        }
        if (fileType === "image" && !file.type.startsWith("image/")) {
          setError("Please upload a valid image file.");
          return;
        }

        setIsUploading(true);
        setLocalProgress(0);

        try {
          console.log("Starting upload for:", file.name);

          const endpoint = fileType === "video" ? "videoUploader" : "imageUploader";

          // Using uploadFiles helper directly for granular control
          const res = await uploadFiles(endpoint, {
            files,
            onUploadProgress: ({ progress }) => {
              setLocalProgress(progress);
              if (onProgress) onProgress(progress);
            },
          });

          console.log("uploadFiles result:", res);

          if (res && res.length > 0) {
            onSuccess(res[0]);
          } else {
            // Should rarely happen if no error was thrown
            console.warn("Upload finished but no result returned");
          }
        } catch (err: any) {
          console.error("Error during upload:", err);
          setError(err.message || "An error occurred during upload.");
        } finally {
          setIsUploading(false);
        }
      }
    },
    [fileType, onSuccess, onProgress]
  );

  return (
    <div className="space-y-4">
      <label className="block">
        <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#5C6270]/50 rounded-2xl cursor-pointer bg-[#0F1117] hover:bg-[#171B22] hover:border-[#4F8CFF]/50 transition-all duration-200">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-10 h-10 mb-3 text-[#9AA0AA]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mb-2 text-sm text-[#9AA0AA]" style={{ fontFamily: 'var(--font-inter)' }}>
              <span className="font-semibold text-[#E5E7EB]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-[#5C6270]" style={{ fontFamily: 'var(--font-jetbrains-mono)', letterSpacing: '0.02em' }}>
              {fileType === "video"
                ? "MP4, AVI, MOV (MAX. 128MB)"
                : "PNG, JPG, WEBP (MAX. 4MB)"}
            </p>
          </div>
          <input
            type="file"
            accept={fileType === "video" ? "video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,video/ogg" : "image/*"}
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>
      </label>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-[#9AA0AA]" style={{ fontFamily: 'var(--font-inter)' }}>
            <Loader2 className="w-4 h-4 animate-spin text-[#2DE2A6]" />
            <span>Uploading... {Math.ceil(localProgress)}%</span>
          </div>
          <div className="w-full bg-[#0F1117] rounded-full h-1.5 overflow-hidden border border-[#5C6270]/30">
            <div
              className="bg-[#2DE2A6] h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.ceil(localProgress)}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#171B22] border border-[#FF6B6B]/30 rounded-lg animate-pulse">
          <p className="text-sm text-[#FF6B6B]" style={{ fontFamily: 'var(--font-inter)' }}>{error}</p>
        </div>
      )}
    </div>
  );
}
