"use client";

import * as React from "react";
import clsx from "clsx";
import { X } from "lucide-react";

export function MultiValueInputCell({
    value,
    rowId,
    columnId,
    updateData,
    placeholder = "Add…",
    disabled,
}: {
    value: string[] | null | undefined;
    rowId: string;
    columnId: string;
    updateData?: (rowId: string, columnId: string, value: unknown) => void;
    placeholder?: string;
    disabled?: boolean;
}) {
    const values = Array.isArray(value) ? value : [];
    const [input, setInput] = React.useState("");

    const add = (raw: string) => {
        const v = raw.trim();
        if (!v) return;
        if (values.includes(v)) return;

        updateData?.(rowId, columnId, [...values, v]);
        setInput("");
    };

    const remove = (v: string) => {
        updateData?.(rowId, columnId, values.filter((x) => x !== v));
    };

    return (
        <div
            className="flex min-h-8 w-full flex-wrap items-center gap-1 rounded-md border bg-background px-2 py-1"
            onClick={(e) => e.stopPropagation()}
        >
            {values.map((v) => (
                <span
                    key={v}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                >
                    <span className="max-w-[140px] truncate">{v}</span>
                    {!disabled && (
                        <button
                            type="button"
                            className="opacity-70 hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                remove(v);
                            }}
                            aria-label={`Remove ${v}`}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </span>
            ))}

            <input
                disabled={disabled}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={values.length ? "" : placeholder}
                className={clsx(
                    "h-6 min-w-[80px] flex-1 bg-transparent text-sm outline-none",
                    disabled && "cursor-not-allowed"
                )}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        add(input);
                    }
                    if (e.key === ",") {
                        e.preventDefault();
                        add(input);
                    }
                    if (e.key === "Backspace" && !input && values.length) {
                        remove(values[values.length - 1]);
                    }
                }}
                onBlur={() => {
                    add(input);
                }}
            />
        </div>
    );
}
