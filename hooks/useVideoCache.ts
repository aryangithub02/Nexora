"use client";

import { useState, useEffect } from "react";
import { VideoCache } from "@/lib/video-cache";

export function useVideoCache(reelId: string, initialUrl?: string, isVisible: boolean = false) {
    const [src, setSrc] = useState<string | undefined>(initialUrl);
    const [isCached, setIsCached] = useState(false);

    useEffect(() => {
        // Initialize Cache
        VideoCache.init();
    }, []);

    useEffect(() => {
        if (!reelId) return;

        // Layer 1: Check Memory/IDB
        const cachedUrl = VideoCache.get(reelId);
        if (cachedUrl) {
            setSrc(cachedUrl);
            setIsCached(true);
        } else {
            // Cache Miss: Fallback to initialUrl
            if (initialUrl) {
                setSrc(initialUrl);
            }

            // Populate cache if visible
            if (initialUrl && isVisible) {
                VideoCache.save(reelId, initialUrl);
            }
        }
    }, [reelId, initialUrl, isVisible]);

    return { src, isCached };
}
