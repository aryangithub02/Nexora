import { useState, useEffect } from 'react';

const profileCache = new Map<string, any>();

export function useProfileCache(userId: string | undefined) {
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        if (!userId) return;

        // Check cache first
        if (profileCache.has(userId)) {
            setProfile(profileCache.get(userId));
        }

        // Fetch and update
        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/profile/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    // Update cache
                    profileCache.set(userId, data.profile);
                    // Only update state if different (optional optimization, but simple set is fine)
                    setProfile(data.profile);
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            }
        };

        // If not in cache, or to refresh stale data (optional strategy: cache-first, then network)
        // For now, simple cache-first: if in cache, use it, but maybe fetch in background? 
        // User requested "Cache API responses", optimizing for "Zero functionality change" but "Backend load drops".
        // So if cache exists, don't fetch? Or fetch less often?
        // Let's do: Use cache immediately. If no cache, fetch.

        if (!profileCache.has(userId)) {
            fetchProfile();
        }
    }, [userId]);

    return profile;
}
