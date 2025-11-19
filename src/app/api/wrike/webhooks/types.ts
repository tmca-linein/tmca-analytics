export type BasicWebhookPayload = {
    webhookId: string;
    eventAuthorId: string;
    eventType: string;
    lastUpdatedDate: string;
}

export type WrikeTaskDates = {
    type: string;
    startDate?: string;
    dueDate?: string;
    duration?: number;
    workOnWeekends?: boolean;
};

export type WrikeComment = {
    text: string;
    html: string;
};

export type TaskCreatedPayload = {
    taskId: string;
} & BasicWebhookPayload;

export type TaskDeletedPayload = {
    taskId: string;
} & BasicWebhookPayload;

export type TaskTitleChangedPayload = {
    oldValue: string;
    title: string;
    taskId: string;
} & BasicWebhookPayload;

export type TaskImportanceChangedPayload = {
    oldValue: string;
    importance: string;
    taskId: string;
} & BasicWebhookPayload;

export type TaskStatusChangedPayload = {
    oldStatus: string;
    status: string;
    oldCustomStatusId: string;
    customStatusId: string;
    taskId: string;
} & BasicWebhookPayload;

export type TaskDatesChangedPayload = {
    oldValue: WrikeTaskDates;
    dates: WrikeTaskDates;
    taskId: string;
} & BasicWebhookPayload;

export type TaskParentsAddedPayload = {
    addedParents: string[];
    taskId: string;
} & BasicWebhookPayload;

export type TaskParentsRemovedPayload = {
    removedParents: string[];
    taskId: string;
} & BasicWebhookPayload;

export type TaskResponsiblesAddedPayload = {
    addedResponsibles: string[];
    taskId: string;
} & BasicWebhookPayload;

export type TaskResponsiblesRemovedPayload = {
    removedResponsibles: string[];
    taskId: string;
} & BasicWebhookPayload;

export type TaskSharedsAddedPayload = {
    addedShareds: string[];
    taskId: string;
} & BasicWebhookPayload;

export type TaskSharedsRemovedPayload = {
    removedShareds: string[];
    taskId: string;
} & BasicWebhookPayload;

export type TaskDescriptionChangedPayload = {
    taskId: string;
} & BasicWebhookPayload;

export type TaskCustomFieldChangedPayload = {
    customFieldId: string;
    oldValue: string;
    value: string;
    taskId: string;
} & BasicWebhookPayload;

export type AttachmentAddedPayload = {
    taskId: string;
    attachmentId: string;
} & BasicWebhookPayload;

export type AttachmentDeletedPayload = {
    taskId: string;
    attachmentId: string;
} & BasicWebhookPayload;

export type CommentAddedPayload = {
    commentId: string;
    comment: WrikeComment;
    taskId: string;
} & BasicWebhookPayload;

export type CommentDeletedPayload = {
    commentId: string;
    taskId: string;
} & BasicWebhookPayload;

export type TimelogChangedPayload = {
    timeTrackerId: string;
    type: string;
    hours: string;
    taskId: string;
} & BasicWebhookPayload;

export type FolderCreatedPayload = {
    folderId: string;
} & BasicWebhookPayload;

export type FolderDeletedPayload = {
    folderId: string;
} & BasicWebhookPayload;

export type FolderTitleChangedPayload = {
    oldValue: string;
    title: string;
    folderId: string;
} & BasicWebhookPayload;

export type FolderParentsAddedPayload = {
    addedParents: string[];
    folderId: string;
} & BasicWebhookPayload;

export type FolderParentsRemovedPayload = {
    removedParents: string[];
    folderId: string;
} & BasicWebhookPayload;

export type FolderSharedsAddedPayload = {
    addedShareds: string[];
    folderId: string;
} & BasicWebhookPayload;

export type FolderSharedsRemovedPayload = {
    removedShareds: string[];
    folderId: string;
} & BasicWebhookPayload;

export type FolderDescriptionChangedPayload = {
    folderId: string;
} & BasicWebhookPayload;

export type FolderCommentAddedPayload = {
    commentId: string;
    comment: WrikeComment;
    folderId: string;
} & BasicWebhookPayload;

export type FolderCommentDeletedPayload = {
    commentId: string;
    folderId: string;
} & BasicWebhookPayload;

export type FolderAttachmentAddedPayload = {
    attachmentId: string;
    folderId: string;
} & BasicWebhookPayload;

export type FolderAttachmentDeletedPayload = {
    attachmentId: string;
    folderId: string;
} & BasicWebhookPayload;

export type FolderCustomFieldChangedPayload = {
    customFieldId: string;
    oldValue: string;
    value: string;
    folderId: string;
} & BasicWebhookPayload;

export type ProjectDatesChangedPayload = {
    oldValue: WrikeTaskDates;
    dates: WrikeTaskDates;
    folderId: string;
} & BasicWebhookPayload;

export type ProjectOwnersAddedPayload = {
    addedOwners: string[];
    folderId: string;
} & BasicWebhookPayload;

export type ProjectOwnersRemovedPayload = {
    removedOwners: string[];
    folderId: string;
} & BasicWebhookPayload;

export type ProjectStatusChangedPayload = {
    oldStatus: string;
    status: string;
    oldCustomStatusId: string;
    customStatusId: string;
    taskId: string;
} & BasicWebhookPayload;

export type TaskApprovalStatusChangedPayload = {
    approvalId: string;
    status: string;
    taskId: string;
} & BasicWebhookPayload;

export type TaskApprovalDecisionChangedPayload = {
    approvalId: string;
    decision: string;
    taskId: string;
} & BasicWebhookPayload;

export type TaskApprovalDecisionResetPayload = {
    approvalId: string;
    approverIds: string[];
    taskId: string;
} & BasicWebhookPayload;

export type FolderApprovalStatusChangedPayload = {
    approvalId: string;
    status: string;
    folderId: string;
} & BasicWebhookPayload;

export type FolderApprovalDecisionChangedPayload = {
    approvalId: string;
    decision: string;
    folderId: string;
} & BasicWebhookPayload;

export type FolderApprovalDecisionResetPayload = {
    approvalId: string;
    approverIds: string[];
    folderId: string;
} & BasicWebhookPayload;

export type WorkItemTypeChangedPayload = {
    workItemId: string;
    oldWorkItemTypeId: string;
    newWorkItemTypeId: string;
    newWorkItemTypeTitle: string;
} & BasicWebhookPayload;

export type ImportFromFileCompletedPayload = {
    parentTaskGroupId: string;
    attachmentId: string;
} & BasicWebhookPayload;
