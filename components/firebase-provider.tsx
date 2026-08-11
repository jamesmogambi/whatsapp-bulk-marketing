"use client";

import { useEffect } from "react";
import { app } from "@/lib/firebase";
import { getAnalytics } from "firebase/analytics";

export default function FirebaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const analytics = getAnalytics(app);
      console.log("Firebase connected", app.name, analytics);
    }
  }, []);

  return <>{children}</>;
}
