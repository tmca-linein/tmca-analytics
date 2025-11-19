import { axiosRequest } from "@/lib/axios";
import { WrikeApiContactsResponse, WrikeApiFolderResponse, WrikeApiSpaceResponse } from "./types/wrikeItem";
import { WrikeUser } from "@/generated/prisma/client";
import prisma from "@/lib/db";


export const buildWrikeSpaceContext = async () => {
    const response = await axiosRequest<WrikeApiSpaceResponse>('GET', '/spaces', null, process.env.WRIKE_SYNC_ACCESS_TOKEN)
    const data = response.data.data;
    const spaceDetails = await Promise.all(
        data.map((f) =>
            axiosRequest<WrikeApiFolderResponse>('GET', `/folders/${f.id}`, null, process.env.WRIKE_SYNC_ACCESS_TOKEN).catch(() => null)
        )
    );

    await Promise.all(
        spaceDetails.map(async (res, i) => {
            if (!res) return null;
            const folder = res.data.data[0];
            // console.log(folder)
            const sharedUsers = await Promise.all(
                folder.sharedIds.map(async (userId) => {

                    return await prisma.wrikeUser.findUnique({
                        where: {
                            id: userId
                        }
                    });
                })
            );
            // console.log(folder.id)
            const creationDate = new Date();
            const wrikeItem = await prisma.wrikeItem.create({
                data: {
                    id: folder.id,
                    title: folder.title,
                    itemType: "Space",
                    authorId: "",
                    warning: "",
                    permalink: folder.permalink,
                    createdAt: creationDate,
                    updatedAt: creationDate,
                },
            });

            await Promise.all(
                sharedUsers
                    .filter((u: WrikeUser): u is { id: string } => !!u && !u.deleted)
                    .map((u: WrikeUser) =>
                        prisma.wrikeUserItems.create({
                            data: {
                                userId: u.id,
                                wrikeItemId: wrikeItem.id,
                            },
                        })
                    )
            );

        })
    );
}


export async function buildWrikeUserContext() {
    const res = await axiosRequest<WrikeApiContactsResponse>('GET', `/contacts?active=true`, null, process.env.WRIKE_SYNC_ACCESS_TOKEN);
    const userData = res.data.data;
    await Promise.all(userData.map(async (user) => {
        const { profiles, locale, timezone, me, title, memberIds, companyName, myTeam, ...dbUser } = user;
        await prisma.wrikeUser.create({
            data: dbUser
        })
    }));
}
