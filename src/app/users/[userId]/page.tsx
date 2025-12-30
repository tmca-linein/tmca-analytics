import UserDescription from '@/app/users/[userId]/UserDescription';
import UserDataSkeleton from './_skeletons';
import UserDataLoader from './UserDataLoader';
import { axiosRequest } from "@/lib/axios";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { Suspense } from "react";
import { WrikeApiContactsResponse } from '@/types/user';
import { redirect } from 'next/navigation';

async function fetchUserInfo(userId: string) {
    const userDetailsResponse = await axiosRequest<WrikeApiContactsResponse>("GET", `/users/${userId}`);
    const userDetails = userDetailsResponse.data.data[0];
    return userDetails;
}
export default async function UserDetailsPage({
    params,
}: {
    params: { userId: string };
}) {
    const { userId } = await params;
    const session = await getServerSession(authConfig);
    const isAuthenticated = !!session && (session?.error !== "RefreshAccessTokenError");
    if (!isAuthenticated) {
        redirect("/login");
    }

    const userDetails = await fetchUserInfo(userId);
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
                <div className="bg-primary-foreground p-4 rounded-lg"><UserDescription user={userDetails} /></div>
                <Suspense fallback={<div className="bg-primary-foreground p-4 rounded-lg"><UserDataSkeleton /></div>}>
                    <UserDataLoader userId={userId} />
                </Suspense>
            </div>
        </>
    );
}