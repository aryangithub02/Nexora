"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export interface LiveUser {
    _id: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
    currentActivity: {
        type: 'watching' | 'uploading' | 'idle';
    };
    isActive: boolean;
}

export function useLiveRadar() {
    const { status } = useSession();
    const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);

    useEffect(() => {
        if (status !== 'authenticated') return;

        const fetchRadar = async () => {
            try {
                const res = await fetch('/api/radar/live');
                if (res.ok) {
                    const data = await res.json();
                    setLiveUsers(data.users || []);
                }
            } catch (e) {
                console.error(e);
            }
        };

        fetchRadar();
        const interval = setInterval(fetchRadar, 20000); // Poll every 20s
        return () => clearInterval(interval);
    }, [status]);

    return { liveUsers };
}
