export interface WrikeApiTaskResponse {
    data: WrikeTaskData[]
}

export type WrikeTaskData = {
    id: string;
    accountId: string;
    title: string;
    description: string;
    briefDescription: string;
    parentIds: string[];
    superParentIds: string[];
    sharedIds: string[];
    responsibleIds: string[];
    status: string;
    importance: string;
    createdDate: string;
    updatedDate: string;
    dates: {
        type: string;
    };
    scope: string;
    authorIds: string[];
    customStatusId: string;
    hasAttachments: boolean;
    permalink: string;
    priority: string;
    followedByMe: boolean;
    followerIds: string[];
    superTaskIds: string[];
    subTaskIds: string[];
    dependencyIds: string[];
    metadata: {
        key: string;
        value: string;
    }[];
    customFields: {
        id: string;
        value: string;
    }[];
}