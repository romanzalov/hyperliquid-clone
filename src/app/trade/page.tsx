"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TradePage() {
    const router = useRouter();
    
    useEffect(() => {
        router.replace("/");
    }, [router]);

    return (
        <div className="flex items-center justify-center h-screen">
            <p>Redirecting to main trading interface...</p>
        </div>
    );
} 