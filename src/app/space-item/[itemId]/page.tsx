import { axiosRequest } from "@/lib/axios";
import { Suspense } from "react";
import DataLoadingSkeleton from '@/components/AppSkeleton';
import ItemDataLoader from './ItemDataLoader';
import ItemDescription from './ItemDescription';
import { WrikeApiFolderResponse } from "@/types/wrikeItem";

async function fetchItemInfo(itemId: string) {
    const itemDetailsResponse = await axiosRequest<WrikeApiFolderResponse>("GET", `/folders/${itemId}`);
    const itemDetails = itemDetailsResponse.data.data[0];
    return itemDetails;
}

export default async function ItemDetailsPage({
    params,
}: {
    params: Promise<{ itemId: string }>;
}) {
    const { itemId } = await params;
    const itemDetails = await fetchItemInfo(itemId);
    const isProject = !!itemDetails.project;
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
                <div className="bg-primary-foreground p-4 rounded-lg"><ItemDescription item={itemDetails} isProject={isProject} /></div>
                <Suspense fallback={<div className="bg-primary-foreground p-4 rounded-lg"><DataLoadingSkeleton /></div>}>
                    <ItemDataLoader itemId={itemId} isProject={isProject} />
                </Suspense>
            </div>
        </>
    );

}
