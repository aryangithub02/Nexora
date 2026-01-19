"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

import { Loader2, Check, X, ZoomIn, ZoomOut } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";

function getCroppedImg(imageSrc: string, pixelCrop: any) {
    const createImage = (url: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous");
            image.src = url;
        });

    return new Promise<Blob>(async (resolve, reject) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            return reject(new Error("No 2d context"));
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Canvas is empty"));
                return;
            }
            resolve(blob);
        }, "image/jpeg");
    });
}

// Basic Modal Implementation since we might not have a UI library installed
const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#171B22] rounded-2xl w-full max-w-lg border border-[#2A2F3A] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-[#2A2F3A]">
                    <h3 className="text-lg font-bold text-white font-[family-name:var(--font-space-grotesk)]">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}


interface ImageCropperProps {
    imageSrc: string;
    isOpen: boolean;
    onClose: () => void;
    onCheck: (url: string) => void;
    aspectRatio: number; // 1 for avatar, 3 for banner
    circularCrop?: boolean;
}

export default function ImageCropper({
    imageSrc,
    isOpen,
    onClose,
    onCheck,
    aspectRatio,
    circularCrop = false,
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const { startUpload, isUploading } = useUploadThing("imageUploader", {
        onClientUploadComplete: (res) => {
            if (res && res.length > 0) {
                onCheck(res[0].url);
                onClose();
            }
        },
        onUploadError: (e) => {
            console.error("ImageCropper save error:", e.message || e);
            alert("Failed to upload image. Please try again.");
        },
        onUploadProgress: (p) => {
            setUploadProgress(p);
        }
    });


    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            const file = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });

            await startUpload([file]);

        } catch (e: any) {
            console.error("ImageCropper processing error:", e.message || e);
            alert("Failed to process image.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Image">
            <div className="relative w-full h-80 bg-black">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspectRatio}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    cropShape={circularCrop ? "round" : "rect"}
                    showGrid={false}
                />
            </div>

            <div className="p-6 space-y-6">
                {/* Zoom Control */}
                <div className="flex items-center gap-4">
                    <ZoomOut size={16} className="text-gray-400" />
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-1 bg-[#2A2F3A] rounded-lg appearance-none cursor-pointer accent-[#2DE2A6]"
                    />
                    <ZoomIn size={16} className="text-gray-400" />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors font-medium border border-transparent hover:border-gray-600 rounded-lg"
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isUploading}
                        className="px-6 py-2 text-sm text-[#0F1117] bg-[#2DE2A6] hover:bg-[#26c08d] transition-all rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading... {uploadProgress}%
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
