import { useState, useEffect } from 'react';

const profileCache = new Map<string, any>();

export function useProfileCache(userId: string | undefined) {
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        if (!userId) return;

        if (profileCache.has(userId)) {
            setProfile(profileCache.get(userId));
        }

        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/profile/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    
                    profileCache.set(userId, data.profile);
                    
                    setProfile(data.profile);
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
            }
        };

        if (!profileCache.has(userId)) {
            fetchProfile();
        }
    }, [userId]);

    return profile;
}
