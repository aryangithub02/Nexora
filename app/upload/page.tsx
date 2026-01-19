"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import FileUpload from "@/app/components/FileUpload";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ClientUploadedFileData } from "uploadthing/types";
import { generateThumbnailFromUrl } from "@/lib/video-utils";
import { uploadFiles } from "@/lib/uploadthing";

export default function UploadPage() {
  const { status } = useSession();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [uploadedFile, setUploadedFile] = useState<ClientUploadedFileData<any> | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // State for thumbnail handling
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleVideoUpload = async (file: ClientUploadedFileData<any>) => {
    setUploadedFile(file);
    setProgress(0);

    // Start generating thumbnail immediately after video upload
    if (file.url) {
      setIsGeneratingThumbnail(true);
      try {
        console.log("Generating thumbnail from:", file.url);
        const thumbnailBlob = await generateThumbnailFromUrl(file.url);
        const thumbnailFile = new File([thumbnailBlob], "thumbnail.jpg", { type: "image/jpeg" });

        console.log("Uploading thumbnail...");
        const res = await uploadFiles("imageUploader", {
          files: [thumbnailFile],
        });

        if (res && res.length > 0) {
          console.log("Thumbnail uploaded:", res[0].url);
          setThumbnailUrl(res[0].url);
        }
      } catch (err) {
        console.error("Failed to generate/upload thumbnail:", err);
        // Fallback to video URL is handled in save if empty, or we can set it here
        // But we prefer explicit failed state or just use videoUrl later
      } finally {
        setIsGeneratingThumbnail(false);
      }
    }
  };

  const handleSaveVideo = async () => {
    if (!uploadedFile) return;

    setSaving(true);
    setError(null);

    try {
      console.log("Attempting to save video...");
      console.log("Uploaded File:", uploadedFile);
      console.log("Thumbnail URL:", thumbnailUrl);

      const finalThumbnailUrl = thumbnailUrl || uploadedFile.url;

      const videoData = {
        title: title.trim() || "Untitled Video",
        description: description.trim() || "No description",
        videoUrl: uploadedFile.url,
        thumbnailUrl: finalThumbnailUrl,
      };

      console.log("Payload to api/videos:", videoData);

      const res = await apiClient.createVideo(videoData);
      console.log("API Response:", res);

      // Redirect to home page after successful save
      router.push("/");
    } catch (err: any) {
      console.error("Error in handleSaveVideo:", err);
      setError(err.message || "Failed to save video. Please try again.");
      setSaving(false);
    }
  };

  // Redirect if not authenticated
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F1117]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4F8CFF]" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0F1117] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#171B22] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] p-8 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold text-[#E5E7EB]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Upload Video
            </h1>
            <p className="text-[#9AA0AA] text-sm">
              Share your video with the community
            </p>
          </div>

          {error && (
            <div className="bg-[#171B22] border border-[#FF6B6B]/30 text-[#FF6B6B] px-4 py-3 rounded-lg text-sm animate-pulse">
              {error}
            </div>
          )}

          {!uploadedFile ? (
            <>
              <FileUpload
                fileType="video"
                onSuccess={handleVideoUpload}
              />
            </>
          ) : (
            <>
              {/* Video Preview */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#E5E7EB] mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    Video Preview (Instagram Reels Format)
                  </label>
                  <div className="rounded-2xl overflow-hidden bg-[#0F1117] max-w-sm mx-auto shadow-[0_8px_24px_rgba(0,0,0,0.35)] relative group">
                    <div className="relative w-full" style={{ aspectRatio: "9/16" }}>
                      <video
                        ref={videoRef}
                        src={uploadedFile.url}
                        controls
                        className="w-full h-full object-cover bg-black"
                        playsInline
                        onError={(e) => {
                          console.error("Preview video error:", e.currentTarget.error, "Src:", e.currentTarget.src);
                        }}
                      />
                    </div>

                    {/* Thumbnail Overlay Hint */}
                    {isGeneratingThumbnail && (
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 z-10">
                        <Loader2 className="w-3 h-3 text-[#2DE2A6] animate-spin" />
                        <span className="text-xs text-white/90 font-medium">Generating Thumbnail...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thumbnail Preview Row */}
                <div className="flex items-center gap-4 py-2">
                  <div className="w-16 h-24 bg-[#0F1117] rounded-lg border border-[#5C6270]/30 overflow-hidden relative group cursor-pointer">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#171B22]">
                        {isGeneratingThumbnail ? (
                          <Loader2 className="w-5 h-5 text-[#2DE2A6] animate-spin" />
                        ) : (
                          <span className="text-[10px] text-[#5C6270] text-center px-1">No Thumb</span>
                        )}
                      </div>
                    )}

                    {/* Overlay for manual upload */}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setIsGeneratingThumbnail(true);
                            try {
                              const res = await uploadFiles("imageUploader", { files: [file] });
                              if (res && res[0]) {
                                setThumbnailUrl(res[0].url);
                              }
                            } catch (err) {
                              console.error("Custom thumb upload failed", err);
                              setError("Failed to upload custom thumbnail");
                            } finally {
                              setIsGeneratingThumbnail(false);
                            }
                          }
                        }}
                      />
                      <span className="text-[10px] text-white font-bold text-center leading-tight">Change<br />Cover</span>
                    </label>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#E5E7EB] font-medium">Cover Image</p>
                    <p className="text-xs text-[#9AA0AA]">Auto-generated or upload your own</p>
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-[#E5E7EB] mb-1" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title (optional)"
                    className="w-full px-4 py-2 rounded-lg bg-[#0F1117] border border-[#5C6270]/50 text-[#E5E7EB] placeholder-[#5C6270] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-[#4F8CFF] transition-all duration-200"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[#E5E7EB] mb-1" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your video (optional)"
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg bg-[#0F1117] border border-[#5C6270]/50 text-[#E5E7EB] placeholder-[#5C6270] focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] focus:border-[#4F8CFF] transition-all duration-200 resize-none"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  />
                </div>

                {/* Upload Info */}
                <div className="p-4 bg-[#0F1117] rounded-lg space-y-2 border border-[#5C6270]/20">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9AA0AA]">File Name:</span>
                    <span className="text-[#E5E7EB] font-medium" style={{ fontFamily: 'var(--font-inter)' }}>{uploadedFile.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9AA0AA]">File Size:</span>
                    <span className="text-[#E5E7EB] font-medium" style={{ fontFamily: 'var(--font-jetbrains-mono)', letterSpacing: '0.02em' }}>{formatFileSize(uploadedFile.size)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setTitle("");
                      setDescription("");
                      setError(null);
                      setThumbnailUrl("");
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-[#5C6270]/50 text-[#E5E7EB] font-medium hover:bg-[#0F1117] hover:border-[#9AA0AA] transition-all duration-200"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                    disabled={saving}
                  >
                    Upload Another
                  </button>
                  <button
                    onClick={handleSaveVideo}
                    disabled={saving || isGeneratingThumbnail}
                    className="flex-1 px-4 py-2 rounded-lg bg-[#4F8CFF] text-white font-medium hover:bg-[#3D7AFF] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(79,140,255,0.3)]"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : isGeneratingThumbnail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Save & Publish"
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
