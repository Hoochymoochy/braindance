import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface YouTubeEmbedProps {
  videoId: string;
  triggerUnmute?: boolean;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoId,
  triggerUnmute,
}) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const youtubePlayer = useRef<any>(null); // Ref to store the YouTube player instance
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Dynamically load YouTube's iframe API script
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => {
      youtubePlayer.current = new window.YT.Player(playerRef.current!, {
        videoId,
        events: {
          onReady: (event: any) => {
            event.target.mute();
            event.target.playVideo();
          },
        },
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          disablekb: 1,
          playsinline: 1,
        },
      });
    };

    // Fade in after 5 seconds
    const timeout = setTimeout(() => {
      setVisible(true);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [videoId]);

  useEffect(() => {
    // Unmute when `triggerUnmute` prop changes
    if (triggerUnmute && youtubePlayer.current) {
      youtubePlayer.current.unMute();
    }
  }, [triggerUnmute]);

  return (
    <div
      style={{
        position: "relative",
        paddingBottom: "56.25%",
        height: 0,
        overflow: "hidden",
        maxWidth: "100%",
        background: "#000",
        opacity: visible ? 1 : 0,
        transition: "opacity 1s ease-in-out",
      }}
    >
      <div
        ref={playerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none", // Prevent user interaction
        }}
      />
    </div>
  );
};

export default YouTubeEmbed;
