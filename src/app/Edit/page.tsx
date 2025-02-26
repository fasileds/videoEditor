"use client"; // Ensure that this is a client-side component

import { useRouter, useSearchParams } from "next/navigation";
import EditPage from "@/app/components/EditPage";
import React, { useEffect, useState } from "react";

export default function Page() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const videoUrlParam = searchParams.get("videoUrl");
    if (videoUrlParam) {
      setVideoUrl(videoUrlParam);
    }
  }, [searchParams]);

  return (
    <div>
      <EditPage videoUrl={videoUrl || null} />
    </div>
  );
}
