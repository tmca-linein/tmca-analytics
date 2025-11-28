'use client'

import {
    WrikeSignInButton
} from "@/components/auth/authButton";
import { useSession, signOut } from "next-auth/react";

export default function LoginPage() {
    const { data: session } = useSession()
    return (
        <>
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                {/* Header - TMV Capital Style */}
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-green-900 rounded-t-lg px-8 py-5 flex items-center justify-between shadow-lg">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white rounded-lg p-3">
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 16L12 8L28 24L20 24L4 16Z" fill="#004d40" />
                                    <path d="M12 8L20 16L28 16L12 8Z" fill="white" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">TMV Capital</h1>
                                <p className="text-sm text-amber-100">Business Catalyst</p>
                            </div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded p-2">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
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
                            <WrikeSignInButton className="bg-sidebar"/>

                            <p className="mt-6 text-center text-xs text-gray-500">
                                By continuing, you agree to TMV Capital's{' '}
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