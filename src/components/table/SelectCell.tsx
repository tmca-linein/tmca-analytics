import * as React from "react";

type Option = { label: string; value: string };

export function SelectCell({
  value,
  rowId,
  columnId,
  options,
  updateData,
  disabled,
}: {
  value: string | null | undefined;
  rowId: string;
  columnId: string;
  options: Option[];
  updateData?: (rowId: string, columnId: string, value: unknown) => void;
  disabled?: boolean;
}) {
  return (
    <select
      className="h-8 w-full rounded-md border bg-background px-2 text-sm"
      value={value ?? ""}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()} // ✅ avoid triggering row click
      onChange={(e) => updateData?.(rowId, columnId, e.target.value)}
    >
      <option value="" disabled>
        Select…
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
