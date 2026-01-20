"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteLoadingBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const prevPathRef = useRef(pathname);

    useEffect(() => {
        const currentPath = pathname + (searchParams?.toString() || "");
        const prevPath = prevPathRef.current;

        if (currentPath !== prevPath) {
            if (isLoading) {
                setProgress(100);
                setTimeout(() => {
                    setIsVisible(false);
                    setIsLoading(false);
                    setProgress(0);
                }, 200);
            }
            prevPathRef.current = currentPath;
        }
    }, [pathname, searchParams, isLoading]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest("a");

            if (!anchor) return;

            const href = anchor.getAttribute("href");
            if (!href) return;

            const isExternal = href.startsWith("http") ||
                href.startsWith("#") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                anchor.target === "_blank";

            if (isExternal) return;

            startLoading();
        };

        const startLoading = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);

            setIsLoading(true);
            setIsVisible(true);
            setProgress(0);

            let currentProgress = 0;

            const phase1 = setTimeout(() => {
                currentProgress = 30;
                setProgress(30);

                intervalRef.current = setInterval(() => {
                    currentProgress += Math.random() * 3;
                    if (currentProgress >= 70) {
                        currentProgress = 70;
                        if (intervalRef.current) clearInterval(intervalRef.current);

                        intervalRef.current = setInterval(() => {
                            currentProgress += Math.random() * 0.5;
                            if (currentProgress >= 90) {
                                currentProgress = 90;
                                if (intervalRef.current) clearInterval(intervalRef.current);
                            }
                            setProgress(currentProgress);
                        }, 500);
                    }
                    setProgress(currentProgress);
                }, 200);
            }, 50);

            timeoutRef.current = phase1;
        };

        document.addEventListener("click", handleClick);

        return () => {
            document.removeEventListener("click", handleClick);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
            <div
                className="h-[3px] transition-all duration-200 ease-out"
                style={{
                    width: `${progress}%`,
                    background: "var(--accent, #4ef2b2)",
                    boxShadow: `0 0 10px var(--accent, #4ef2b2), 0 0 5px var(--accent, #4ef2b2)`,
                }}
            />
            {progress > 0 && progress < 100 && (
                <div
                    className="absolute top-0 right-0 h-[3px] w-[100px] opacity-50"
                    style={{
                        transform: `translateX(${progress < 100 ? 0 : 100}px)`,
                        background: `linear-gradient(to right, transparent, var(--accent, #4ef2b2))`,
                        right: `${100 - progress}%`,
                    }}
                />
            )}
        </div>
    );
}
