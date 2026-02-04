import { DisplayItemMetrics } from "./stats";

export type User = {
    id: string;
    firstName: string;
    lastName: string;
    primaryEmail?: string;
    subRows?: User[];
    warning?: string;
} & Omit<DisplayItemMetrics, "id" | "day" | "wrikeItemId">;

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

export type ApiWrikeUserProfile = {
    accountId: string;
    email: string;
    role: string;
    external: boolean;
    admin: boolean;
    owner: boolean;
    active: boolean;
}

export type ApiWrikeUser = {
    id: string;
    firstName: string;
    lastName: string;
    type: string;
    avatarUrl?: string;
    deleted: boolean
    profiles?: ApiWrikeUserProfile[];
    locale: string;
    timezone: string;
    me?: boolean;
    title?: string;
    memberIds?: string[];
    companyName?: string;
    myTeam?: boolean;
    userTypeId: string;
    primaryEmail?: string;
    phone?: string;
    location?: string;
};


export interface WrikeLegacyIdConversionResponse {
    data: ApiWrikeLegacyUserIdConversion[]
}

export type ApiWrikeLegacyUserIdConversion = {
    id: string;
    apiV2Id: string;
}