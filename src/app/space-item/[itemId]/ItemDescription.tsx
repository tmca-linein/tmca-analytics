import { Calendar1, Link, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { WrikeFolder } from "@/types/wrikeItem";
import sanitizeHtml from "sanitize-html";

function sanitizeWrikeDescription(dirty: string) {
    return sanitizeHtml(dirty, {
        allowedTags: [
            "span", "b", "strong", "br",
            "ol", "ul", "li",
            "p",
            "label",
        ],
        allowedAttributes: {
            span: ["style"],
            p: ["style"],
            li: ["style"],
            ul: ["style", "class"],
            ol: ["style", "class"],
            label: ["class"],
            input: ["type", "checked", "disabled"],
        },

        allowedSchemes: ["https"],
        allowProtocolRelative: false,

        allowedStyles: {
            span: {
                "background-color": [
                    /^#[0-9a-fA-F]{3}$/,
                    /^#[0-9a-fA-F]{6}$/,
                    /^#[0-9a-fA-F]{8}$/,
                    /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
                    /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0|0?\.\d+|1(\.0)?)\s*\)$/,
                ],
            },
            p: {
                "padding-left": [/^\d+(\.\d+)?(px|em|rem)$/],
            },
            ul: {
                "list-style-type": [/^(none|disc|circle|square)$/],
            },
            li: {
                "list-style-type": [/^(none|disc|circle|square)$/],
            },
        }
    });
}


const ItemDescription = (
    props: { item: WrikeFolder, isProject: boolean },
) => {
    const { item, isProject } = props;
    const nains = item.customFields.filter(cf => cf.id === process.env.FIELD_NEXT_ATTENTION_NEEDED);
    const nain = (!!nains && nains.length > 0) ? nains[0].value : undefined;
    const dtmbfs = item.customFields.filter(cf => cf.id === process.env.FIELD_DATE_THAT_MUST_BE_FINISHED);
    const dtmbf = (!!dtmbfs && dtmbfs.length > 0) ? dtmbfs[0].value : undefined;


    return (
        <div className="h-full flex items-center justify-center ">
            <Card className="h-[500px] w-full rounded-3xl border">
                <Card className="h-full w-full border-0 shadow-none overflow-auto mb-1">
                    <CardHeader className="flex flex-col items-center gap-3 pb-2 pt-2">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold">{isProject ? 'Project: ' : 'Folder: '}{item.title}</h2>
                        </div>
                        <div className="space-y-3 text-sm text-center">
                            <div className="flex items-center justify-center gap-3">
                                <Calendar1 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-semibold">Created date: </span>
                                <span>{item.updatedDate}</span>
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-semibold">Updated date: </span>
                                <span>{item.updatedDate}</span>
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-sm font-semibold">📍Date that must be finished:</span>
                                <span>{String(dtmbf)}</span>
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-sm font-semibold">📍Next attention needed from assignee:</span>
                                <span>{String(nain)}</span>
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <Link className="h-4 w-4 text-muted-foreground" />
                                <a
                                    href={item.permalink}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="max-w-[300px] truncate underline"
                                >
                                    {item.permalink}
                                </a>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div
                            className="text-sm text-muted-foreground space-y-2"
                            dangerouslySetInnerHTML={{ __html: sanitizeWrikeDescription(item.description) }}
                        />
                    </CardContent>
                </Card>
            </Card>
        </div>
    )
}

export default ItemDescription;