"use client";

import { User } from "@/types/user";
import { ColumnDef } from "@tanstack/react-table";


export const getColumns = (): ColumnDef<User>[] => [
  {
    accessorKey: "firstName",
    header: "First Name",
    size: 250,
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
    size: 250,
  },
  {
    accessorKey: "primaryEmail",
    header: "Email",
    cell: ({ cell }) => (
      <div className="whitespace-normal break-words">
        {cell.getValue<string>()}
      </div>
    ),
    size: 400,
    enableSorting: false,
  },
  {
    accessorKey: "anfAddedToday",
    header: "ANF-ADDED Today",
    size: 250,
  },
  {
    accessorKey: "anfAddedThisWeek",
    header: "ANF-ADDED This week",
    size: 250,
  },
  {
    accessorKey: "anfAddedThisMonth",
    header: "ANF-ADDED This month",
    size: 250,
  },
  {
    accessorKey: "anfRemovedToday",
    header: "ANF-REMOVED Today",
    size: 250,
  },
  {
    accessorKey: "anfRemovedThisWeek",
    header: "ANF-REMOVED This week",
    size: 250,
  }, {
    accessorKey: "anfRemovedThisMonth",
    header: "ANF-REMOVED This month",
    size: 250,
  },
  {
    accessorKey: "commentsAddedToday",
    header: "Comments ADDED Today",
    size: 250,
  },
  {
    accessorKey: "commentsAddedThisWeek",
    header: "Comments ADDED This week",
    size: 250,
  },
  {
    accessorKey: "commentsAddedThisMonth",
    header: "Comments ADDED This month",
    size: 250,
  },
  {
    accessorKey: "avgCommentLengthToday",
    header: "Avg. comment lenght today",
    size: 250,
  },
  {
    accessorKey: "avgCommentLengthThisWeek",
    header: "Avg. comment lenght this week",
    size: 250,
  },
  {
    accessorKey: "avgCommentLengthThisMonth",
    header: "Avg. comment lenght this month",
    size: 250,
  }
];