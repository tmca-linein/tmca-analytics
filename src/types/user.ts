export type User = {
    id: string;
    firstName: string;
    lastName: string;
    primaryEmail?: string;
    anfAddedToday: number;
    anfAddedThisWeek: number;
    anfAddedThisMonth: number;
    anfRemovedToday: number;
    anfRemovedThisWeek: number;
    anfRemovedThisMonth: number;
    commentsAddedToday: number;
    commentsAddedThisWeek: number;
    commentsAddedThisMonth: number;
    avgCommentLengthToday: number;
    avgCommentLengthThisWeek: number;
    avgCommentLengthThisMonth: number;
    subRows?: User[];
    warning?: string;
};

export interface WrikeApiUserGroupResponse {
    data: ApiWrikeUserGroup[]
}

export type ApiWrikeUserGroup = {
    id: string;
    accountId: string;
    title: string;
    memberIds: string[];
    childIds: string[];
    parentIds: string[]
    avatarUrl: string;
    myteam?: boolean;
};

export interface WrikeApiContactsResponse {
    data: ApiWrikeUser[]
}

export type ApiWrikeUser = {
    id: string;
    firstName: string;
    lastName: string;
    type: string;
    avatarUrl?: string;
    deleted: boolean
    profiles?: unknown;
    locale: string;
    timezone: string;
    me?: boolean;
    title?: string;
    memberIds?: string[];
    companyName?: string;
    myTeam?: boolean;
    userTypeId: string;
    primaryEmail?: string;
};


export interface WrikeLegacyIdConversionResponse {
    data: ApiWrikeLegacyUserIdConversion[]
}

export type ApiWrikeLegacyUserIdConversion = {
    id: string;
    apiV2Id: string;
}