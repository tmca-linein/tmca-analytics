import { WrikeUser } from "@/generated/prisma/client";

export interface WrikeApiFolderTreeResponse {
    data: WrikeFolderTree[];
}

export interface WrikeApiFolderResponse {
    data: WrikeFolder[];
}

export interface WrikeApiTasksResponse {
    data: WrikeTask[]
}

export interface WrikeApiContactsResponse {
    data: ApiWrikeUser[]
}

export type ApiWrikeUser = WrikeUser & {
    profiles?: unknown;
    locale: string;
    timezone: string;
    me?: boolean;
    title?: string;
    memberIds?: unknown;
    companyName?: string;
    myTeam?: boolean;
};

export type SpaceItem = {
    itemId: string;
    itemName: string;
    itemType: "Space" | "Project" | "Folder" | "Task";
    author: string;
    childIds: string[];
    warning?: string;
    permalink?: string;
    sharedWith?: string;
    subRows: SpaceItem[];
};

export type WrikeFolder = {
    id: string;
    accountId: string;
    title: string;
    createdDate: string;
    updatedDate: string;
    description: string;
    sharedIds: string[];
    parentIds: string[];
    childIds: string[];
    superParentIds: string[];
    scope: string;
    space: boolean;
    hasAttachments: boolean;
    permalink: string;
    workflowId: string;
    metadata: string[];
    customFields: string[];
}

export type WrikeTask = {
    id: string;
    accountId: string;
    title: string;
    sharedIds: string[];
    authorIds: string[];
    status: string;
    importance: string;
    createdDate: string;
    updatedDate: string;
    dates: any;
    scope: string;
    customStatusId: string;
    permalink: string;
    priority: string;
}

export type WrikeFolderTreeProject = {
    authorId: string;
    createDate: Date;
    customStatusId: string;
    ownerIds: string[];
    startDate: Date;
};

export type WrikeFolderTree = {
    id: string;
    title: string;
    childIds: string[];
    scope: string;
    permalink?: string;
    project?: WrikeFolderTreeProject;
};

export type WrikeSpaceItemTask = {
    id: string,
    accountId: string,
    title: string,
    status: string,
    importance: string,
    createdDate: string,
    updatedDate: string,
    scope: string,
    permalink: string
}

export type WrikeTaskData = {
    id: string,
    title: string,
    description: string,
    briefDescription: string,
    sharedIds: string[],
    authorIds: string[],
    hasAttachments: boolean,
}