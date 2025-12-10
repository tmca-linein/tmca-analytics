export type BasicWebhookPayload = {
    webhookId: string;
    eventAuthorId: string;
    eventType: string;
    lastUpdatedDate: string;
};

export type WrikeComment = {
    text: string;
    html: string;
};

export type CustomFieldChangedPayload = {
    taskId?: string;
    folderId?: string;
    oldValue: string;
    value: string;
    customFieldId?: string;
} & BasicWebhookPayload;

export type WrikeCommentWebhookPayload = {
    commentId: string;
    comment?: WrikeComment;
    taskId?: string;
    folderId?: string;
} & BasicWebhookPayload;