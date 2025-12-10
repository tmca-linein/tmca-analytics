export interface WrikeApiSpaceResponse {
    data: WrikeSpace[];
}

export interface WrikeApiFolderTreeResponse {
    data: WrikeFolderTree[];
}

export interface WrikeApiFolderResponse {
    data: WrikeFolder[];
}

export interface WrikeApiTasksResponse {
    data: WrikeTask[]
}

export type SpaceItem = {
    itemId: string;
    itemName: string;
    itemType: "Space" | "Project" | "Folder" | "Task";
    author: string;
    folderChildIds: string[];
    taskChildIds: string[];
    warning?: string;
    permalink?: string;
    sharedWith?: string;
    subRows: SpaceItem[];
    parentId?: string;
};

export type WrikeSpace = {
    id: string;
    title: string;
    description: string;
    avatarUrl: string;
    accessType: string;
    archived: boolean;
    guestRoleId: string;
    defaultProjectWorkflowId: string;
    defaultTaskWorkflowId: string;
}

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
    project?: WrikeFolderTreeProject
}

export type WrikeTask = {
    id: string;
    accountId: string;
    title: string;
    subTaskIds: string[];
    sharedIds: string[];
    authorIds: string[];
    status: string;
    importance: string;
    createdDate: string;
    updatedDate: string;
    dates: unknown;
    scope: string;
    customStatusId: string;
    permalink: string;
    priority: string;
}

export type WrikeFolderTreeProject = {
    authorId: string;
    createDate: Date;
    completedDate?: Date;
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