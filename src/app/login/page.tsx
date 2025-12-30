'use client'

import {
    WrikeSignInButton
} from "@/components/auth/authButton";
import Image from "next/image";

export default function LoginPage() {
    return (
        <>
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                {/* Header - TMV Capital Style */}
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-sidebar rounded-t-lg px-8 py-5 flex items-center justify-between shadow-lg">
                        <div className="flex items-center space-x-4">
                            <Image src="/tmca_small.png" alt="logo" width={40} height={35} />
                            <div>
                                <h1 className="text-2xl font-bold text-white">TMV Capital</h1>
                                <p className="text-sm text-secondary">Business Catalyst</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white rounded-b-lg shadow-xl px-10 py-12">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Access your TMV Capital portal
                            </p>
                        </div>

                        <div className="mt-12">
                            {/* Single Button - Full Match to Your Design */}
                            <WrikeSignInButton />

                            <p className="mt-6 text-center text-xs text-gray-500">
                                By continuing, you agree to TMV Capital&apos;s{' '}
                                <a href="#" className="font-medium text-green-900 hover:text-green-700">
                                    Terms of Service
                                </a>{' '}
                                and{' '}
                                <a href="#" className="font-medium text-green-900 hover:text-green-700">
                                    Privacy Policy
                                </a>
                                .
                            </p>
                        </div>
                    </div>

                    {/* Optional Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-500">
                            © 2025 TMV Capital. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}