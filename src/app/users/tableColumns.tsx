"use client";

import { User } from "@/types/user";
import { ColumnDef } from "@tanstack/react-table";


export const getColumns = (): ColumnDef<User>[] => [
  {
    accessorKey: "firstName",
    header: "First Name",
    size: 250,
    meta: { pin: true },
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
    size: 250,
    meta: { pin: true },
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
    accessorKey: "anfAddedDay",
    header: "ANF-ADDED Today",
    size: 250,
  },
  {
    accessorKey: "anfAddedWeek",
    header: "ANF-ADDED This week",
    size: 250,
  },
  {
    accessorKey: "anfAddedMonth",
    header: "ANF-ADDED This month",
    size: 250,
  },
  {
    accessorKey: "anfAddedLastMonth",
    header: "ANF-ADDED Last month",
    size: 250,
  },
  {
    accessorKey: "anfRemovedDay",
    header: "ANF-REMOVED Today",
    size: 250,
  },
  {
    accessorKey: "anfRemovedWeek",
    header: "ANF-REMOVED This week",
    size: 250,
  },
  {
    accessorKey: "anfRemovedMonth",
    header: "ANF-REMOVED This month",
    size: 250,
  },
  {
    accessorKey: "anfRemovedLastMonth",
    header: "ANF-REMOVED Last month",
    size: 250,
  },
  {
    accessorKey: "avgDurationWeek",
    header: "ANF-AVG-Duration This week",
    size: 250
  },
  {
    accessorKey: "avgDurationMonth",
    header: "ANF-AVG-Duration This month",
    size: 250
  },
  {
    accessorKey: "avgDurationLastMonth",
    header: "ANF-AVG-Duration Last month",
    size: 250
  },
  {
    accessorKey: "topFiveAvgDurationWeek",
    header: "ANF-AVG-TOP5-Duration This week",
    size: 300
  },
  {
    accessorKey: "topFiveAvgDurationMonth",
    header: "ANF-AVG-TOP5-Duration This month",
    size: 300
  },
  {
    accessorKey: "topFiveAvgDurationLastMonth",
    header: "ANF-AVG-TOP5-Duration Last month",
    size: 300
  },
  {
    accessorKey: "avgOverdueHoursWeek",
    header: "ANF-AVG-Overdue-Duration This week",
    size: 300
  },
  {
    accessorKey: "avgOverdueHoursMonth",
    header: "ANF-AVG-Overdue-Duration This month",
    size: 300
  },
  {
    accessorKey: "avgOverdueHoursLastMonth",
    header: "ANF-AVG-Overdue-Duration Last month",
    size: 300
  },
  {
    accessorKey: "overdueCountWeek",
    header: "ANF-Overdue-Counts This week",
    size: 250
  },
  {
    accessorKey: "overdueCountMonth",
    header: "ANF-Overdue-Counts This month",
    size: 250
  },
  {
    accessorKey: "overdueCountLastMonth",
    header: "ANF-Overdue-Counts Last month",
    size: 250
  },
  {
    accessorKey: "transitionsCountWeek",
    header: "ANF-Transition-Counts This week",
    size: 250
  },
  {
    accessorKey: "transitionsCountMonth",
    header: "ANF-Transition-Counts This month",
    size: 250
  },
  {
    accessorKey: "transitionsCountLastMonth",
    header: "ANF-Transition-Counts Last month",
    size: 250
  },
  {
    accessorKey: "countDay",
    header: "Comments-ADDED Today",
    size: 250,
  },
  {
    accessorKey: "countWeek",
    header: "Comments-ADDED This week",
    size: 250,
  },
  {
    accessorKey: "countMonth",
    header: "Comments-ADDED This month",
    size: 250,
  },
  {
    accessorKey: "countLastMonth",
    header: "Comments-ADDED Last month",
    size: 250,
  },
  {
    accessorKey: "avgWordCountDay",
    header: "Comment-AVG-Length Today",
    size: 250,
  },
  {
    accessorKey: "avgWordCountWeek",
    header: "Comment-AVG-Length This week",
    size: 250,
  },
  {
    accessorKey: "avgWordCountMonth",
    header: "Comment-AVG-Length This month",
    size: 250,
  },
  {
    accessorKey: "avgWordCountLastMonth",
    header: "Comment-AVG-Length Last month",
    size: 250,
  }
];