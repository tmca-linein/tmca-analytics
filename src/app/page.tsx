
'use client'
import {
  WrikeSignInButton
} from "@/components/auth/authButton";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";
import { useSession, signOut} from "next-auth/react";

export default function SignInPage() {
  const { data: session } = useSession()


  if (session) {
    return (
      <>
        Signed in as {session.user.name} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen py-2">
      <div className="flex flex-col items-center mt-10 p-10 shadow-md">
        <h1 className="mt-10 mb-4 text-4xl font-bold">Sign In</h1>
        <WrikeSignInButton />
      </div>
    </div>
  );
}