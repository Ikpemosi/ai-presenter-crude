"use client";

import { useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [authFailed, setAuthFailed] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthorized(true);
  };

  const handleAuthFailure = () => {
    setAuthFailed(true);
  };

  if (authFailed) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            Sorry, this proposal wasn't written for you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!isAuthorized ? (
        <AuthDialog
          onAuthSuccess={handleAuthSuccess}
          onAuthFailure={handleAuthFailure}
        />
      ) : (
        <main className="container mx-auto p-4">
          <ChatInterface />
        </main>
      )}
    </div>
  );
}