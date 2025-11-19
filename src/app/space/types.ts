export type SpaceItem = {
  itemId: string;
  itemName: string;
  itemType: "Space" | "Project" | "Folder" | "Task";
  author: string;
  childIds: string[];
  warning?: string;
  permalink?: string;
  sharedWith?: string;
  subRows: SpaceItem[]
};

export type WrikeUserData = {
  id: string;
  firstName: string;
  lastName: string;
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
  space: boolean;
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
