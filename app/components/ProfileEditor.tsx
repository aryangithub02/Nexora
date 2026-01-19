"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Camera, Save, Loader2, AlertCircle } from "lucide-react";
import ImageCropper from "./ImageCropper";
import { IProfile } from "@/models/Profile";

interface ProfileEditorProps {
    initialProfile: IProfile | null;
}

export default function ProfileEditor({ initialProfile }: ProfileEditorProps) {
    // State
    const [persistedProfile, setPersistedProfile] = useState<IProfile | null>(initialProfile);
    const [draftProfile, setDraftProfile] = useState<Partial<IProfile>>(initialProfile || {
        username: "",
        displayName: "",
        bio: "",
        avatarUrl: "",
        bannerUrl: "",
        themeAccent: "#2DE2A6"
    });

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cropper State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [currentImageSrc, setCurrentImageSrc] = useState<string>("");
    const [cropTarget, setCropTarget] = useState<"avatar" | "banner">("avatar");

    // Refs for file inputs
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Derived State
    const hasChanges = JSON.stringify(draftProfile) !== JSON.stringify(persistedProfile);

    // Handlers
    const handleInputChange = (field: keyof IProfile, value: string) => {
        setDraftProfile(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "banner") => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setCurrentImageSrc(reader.result as string);
                setCropTarget(target);
                setCropModalOpen(true);
            });
            reader.readAsDataURL(file);
            // Reset input so same file can be selected again if needed
            e.target.value = "";
        }
    };

    const handleCropComplete = (url: string) => {
        if (cropTarget === "avatar") {
            handleInputChange("avatarUrl", url);
        } else {
            handleInputChange("bannerUrl", url);
        }
    };

    const handleSave = async () => {
        if (!hasChanges) return;
        setIsSaving(true);
        setError(null);

        try {
            const res = await fetch("/api/settings/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(draftProfile)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to save profile");
            }

            setPersistedProfile(data.profile);
            setDraftProfile(data.profile);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Live Preview / "Identity Mirror" Section
    const PreviewSection = () => (
        <div className="h-full flex flex-col items-center">
            <div className="w-full max-w-sm bg-black rounded-3xl overflow-hidden border border-[#2A2F3A] shadow-2xl relative group">
                {/* Banner */}
                <div className="h-32 bg-[#1E232F] relative w-full">
                    {draftProfile.bannerUrl ? (
                        <Image src={draftProfile.bannerUrl} alt="Banner" fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Banner</div>
                    )}
                </div>

                {/* Avatar */}
                <div className="absolute top-20 left-4">
                    <div className="w-20 h-20 rounded-full border-4 border-black bg-[#171B22] overflow-hidden relative">
                        {draftProfile.avatarUrl ? (
                            <Image src={draftProfile.avatarUrl} alt="Avatar" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Avatar</div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="pt-10 px-4 pb-6">
                    <h3 className="text-xl font-bold text-white font-[family-name:var(--font-space-grotesk)] truncate">
                        {draftProfile.displayName || "Display Name"}
                    </h3>
                    <p className="text-[#9AA0AA] text-sm mb-4 font-[family-name:var(--font-jetbrains-mono)]">
                        @{draftProfile.username || "username"}
                    </p>

                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-[family-name:var(--font-inter)]">
                        {draftProfile.bio || "No bio yet..."}
                    </div>
                </div>

                {/* Theme Accent Stripe */}
                <div className="h-1 w-full" style={{ backgroundColor: draftProfile.themeAccent || "#2DE2A6" }} />
            </div>

            <p className="mt-8 text-gray-500 text-sm font-[family-name:var(--font-jetbrains-mono)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2DE2A6] animate-pulse"></span>
                Live Preview
            </p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full">

            {/* Left: Edit Form */}
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">

                {/* Visual Identity Section */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white/50 uppercase tracking-wider text-xs font-[family-name:var(--font-jetbrains-mono)]">Visual Identity</h3>

                    <div className="flex items-start gap-6">
                        {/* Avatar Upload */}
                        <div className="space-y-2 text-center">
                            <div
                                className="w-24 h-24 rounded-full bg-[#1E232F] border-2 border-dashed border-[#2A2F3A] flex items-center justify-center cursor-pointer hover:border-[#2DE2A6] transition-colors relative group overflow-hidden"
                                onClick={() => avatarInputRef.current?.click()}
                            >
                                {draftProfile.avatarUrl ? (
                                    <Image src={draftProfile.avatarUrl} alt="Avatar" fill className="object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                ) : null}
                                <Camera className="w-6 h-6 text-gray-400 group-hover:text-[#2DE2A6] relative z-10" />
                            </div>
                            <span className="text-xs text-gray-500">Avatar</span>
                            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, "avatar")} />
                        </div>

                        {/* Banner Upload */}
                        <div className="space-y-2 flex-1 text-center">
                            <div
                                className="w-full h-24 rounded-xl bg-[#1E232F] border-2 border-dashed border-[#2A2F3A] flex items-center justify-center cursor-pointer hover:border-[#2DE2A6] transition-colors relative group overflow-hidden"
                                onClick={() => bannerInputRef.current?.click()}
                            >
                                {draftProfile.bannerUrl ? (
                                    <Image src={draftProfile.bannerUrl} alt="Banner" fill className="object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                ) : null}
                                <Camera className="w-6 h-6 text-gray-400 group-hover:text-[#2DE2A6] relative z-10" />
                            </div>
                            <span className="text-xs text-gray-500">Profile Banner</span>
                            <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e, "banner")} />
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-[#2A2F3A]" />

                {/* Info Section */}
                <div className="space-y-5">
                    <h3 className="text-lg font-semibold text-white/50 uppercase tracking-wider text-xs font-[family-name:var(--font-jetbrains-mono)]">Public Info</h3>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-300">Display Name</label>
                        <input
                            type="text"
                            className="w-full bg-[#0F1117] border border-[#2A2F3A] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#2DE2A6] transition-colors font-[family-name:var(--font-inter)]"
                            value={draftProfile.displayName || ""}
                            onChange={(e) => handleInputChange("displayName", e.target.value)}
                            placeholder="e.g. Alex Chen"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-300">Username</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                            <input
                                type="text"
                                className="w-full bg-[#0F1117] border border-[#2A2F3A] rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-[#2DE2A6] transition-colors font-[family-name:var(--font-inter)]"
                                value={draftProfile.username || ""}
                                onChange={(e) => handleInputChange("username", e.target.value)}
                                placeholder="alexc"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-300">Bio</label>
                        <textarea
                            className="w-full bg-[#0F1117] border border-[#2A2F3A] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#2DE2A6] transition-colors min-h-[120px] resize-none font-[family-name:var(--font-inter)]"
                            value={draftProfile.bio || ""}
                            onChange={(e) => handleInputChange("bio", e.target.value)}
                            placeholder="Tell the world who you are..."
                        />
                    </div>
                </div>

                {/* Feedback */}
                {error && (
                    <div className="flex items-center gap-2 text-[#FF6B6B] text-sm bg-[#FF6B6B]/10 p-3 rounded-lg border border-[#FF6B6B]/20">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className={`
                            px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all duration-300
                            ${hasChanges
                                ? "bg-[#2DE2A6] text-[#0F1117] hover:bg-[#26c08d] shadow-[0_0_20px_rgba(45,226,166,0.3)] transform hover:scale-105"
                                : "bg-[#2A2F3A] text-gray-500 cursor-not-allowed"}
                        `}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>

            </div>

            {/* Right: Live Preview */}
            <div className="hidden lg:block border-l border-[#2A2F3A] pl-12">
                <PreviewSection />
            </div>

            {/* Crop Modal */}
            <ImageCropper
                isOpen={cropModalOpen}
                onClose={() => setCropModalOpen(false)}
                imageSrc={currentImageSrc}
                onCheck={handleCropComplete}
                aspectRatio={cropTarget === "avatar" ? 1 : 3}
                circularCrop={cropTarget === "avatar"}
            />
        </div>
    );
}
