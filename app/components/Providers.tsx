"use client";

import { SessionProvider } from "next-auth/react";
import { ImageKitProvider } from "@imagekit/next";
import { NotificationProvider } from "@/app/context/NotificationContext";
import { VolumeProvider } from "@/app/context/VolumeContext";
import { AppearanceProvider } from "@/app/context/AppearanceContext";
import NotificationPanel from "@/app/components/NotificationPanel";
import RouteLoadingBar from "@/app/components/RouteLoadingBar";
import { Suspense } from "react";


export default function Providers({ children }: { children: React.ReactNode }) {
  const urlEndpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT;

  if (!urlEndpoint) {
    console.warn("NEXT_PUBLIC_URL_ENDPOINT is not set. ImageKit features may not work.");
  }

  return (
    <SessionProvider refetchInterval={5 * 60}>
      <AppearanceProvider>
        <Suspense fallback={null}>
          <RouteLoadingBar />
        </Suspense>
        <VolumeProvider>
          <NotificationProvider>
            <NotificationPanel />
            {urlEndpoint ? (
              <ImageKitProvider urlEndpoint={urlEndpoint}>
                {children}
              </ImageKitProvider>
            ) : (
              children
            )}
          </NotificationProvider>
        </VolumeProvider>
      </AppearanceProvider>
    </SessionProvider>
  );
}
