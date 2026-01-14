'use client'

import Image from "next/image";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Header - TMV Capital Style */}
                <div className="bg-sidebar rounded-t-lg px-8 py-5 flex items-center justify-between shadow-lg">
                    <div className="flex items-center space-x-4">
                        <Image src="/tmca_small.png" alt="logo" width={40} height={35} />
                        <div>
                            <h1 className="text-2xl font-bold text-white">TMV Capital</h1>
                            <p className="text-sm text-secondary">Business Catalyst</p>
                        </div>
                    </div>

                    <span className="text-xs font-semibold tracking-widest text-white/80">
                        404
                    </span>
                </div>

                {/* Info Box */}
                <div className="bg-white rounded-b-lg shadow-xl px-10 py-10">
                    {/* Graphic */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <svg
                                width="160"
                                height="120"
                                viewBox="0 0 160 120"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="drop-shadow-sm"
                            >
                                {/* soft glow */}
                                <ellipse cx="80" cy="92" rx="54" ry="12" fill="#E5E7EB" />

                                {/* planet */}
                                <circle cx="56" cy="54" r="26" fill="#D1D5DB" />
                                <path
                                    d="M30 54c10-8 42-10 52 0"
                                    stroke="#9CA3AF"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    opacity="0.6"
                                />

                                {/* ring */}
                                <ellipse
                                    cx="56"
                                    cy="56"
                                    rx="44"
                                    ry="14"
                                    stroke="#10B981"
                                    strokeWidth="6"
                                    opacity="0.9"
                                />

                                {/* tiny star */}
                                <path
                                    d="M126 26l2.4 6.7 6.6 2.4-6.6 2.4-2.4 6.7-2.4-6.7-6.6-2.4 6.6-2.4L126 26z"
                                    fill="#10B981"
                                    opacity="0.9"
                                />

                                {/* 404 text */}
                                <text
                                    x="90"
                                    y="82"
                                    fontSize="28"
                                    fontWeight="800"
                                    fill="#111827"
                                    textAnchor="middle"
                                >
                                    404
                                </text>
                            </svg>

                            {/* tiny badge */}
                            <div className="absolute -top-2 -right-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-900 border border-green-200">
                                Not found
                            </div>
                        </div>
                    </div>

                    {/* Copy */}
                    <div className="mt-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                            This page doesn’t exist
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                            The link may be outdated, the page may have moved, or you may not have access.
                            If you arrived here from inside the portal, please report the broken link.
                        </p>
                    </div>

                    {/* Small “diagnostic” hint */}
                    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs text-gray-600">
                            <span className="font-semibold text-gray-900">Tip:</span> Check the URL for typos.
                            If you’re expecting a page here, confirm you’re signed in with the correct account.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">
                        © 2025 TMV Capital. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
