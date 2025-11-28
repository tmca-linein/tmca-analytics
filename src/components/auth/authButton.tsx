"use client";

import Image from "next/image";
// import wrikeLogo from "@/../public/wrike.png";
import { signIn } from "next-auth/react";

export function WrikeSignInButton() {
  const handleClick = () => {
    signIn("wrike");
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center font-semibold justify-center h-14 px-6 mt-4 text-xl bg-sidebar transition-colors duration-300 rounded-lg focus:shadow-outline hover:bg-sidebar/90"
    >
      {/* <Image src="" alt="Wrike Logo" width={20} height={20} /> */}
      <span className="ml-4 text-white">SignIn with Wrike</span>
    </button>
  );
}
