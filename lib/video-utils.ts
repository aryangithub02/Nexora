export async function generateThumbnailFromUrl(videoUrl: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.src = videoUrl;
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            
            video.currentTime = 0.1;
        };

        video.onseeked = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Could not get canvas context"));
                    return;
                }

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Thumbnail generation failed"));
                    }
                    
                    video.remove();
                }, "image/jpeg", 0.85); 

            } catch (e) {
                reject(e);
            }
        };

        video.onerror = (e) => {
            reject(new Error("Video load failed during thumbnail generation"));
        };
    });
}
