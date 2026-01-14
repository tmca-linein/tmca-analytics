"use server"
import { RBAC } from "@/generated/prisma";
import { AdminTable } from "./AdminTable";
import { getCompanies, getRoleOptions } from "@/lib/ug-extractor";
import prisma from "@/lib/db";

async function fetchRBAC(): Promise<RBAC[]> {
    const rbac = await prisma.rBAC.findMany();
    return rbac;
}

async function loadRBACSelectOptions() {
    const companies = await getCompanies();
    const companyRoles = await getRoleOptions();
    return { companies, companyRoles }
}

export async function saveRBACConfig(rows: RBAC[]) {
    const original = await fetchRBAC();
    const originalById = new Map(original.filter(r => r.id).map(r => [r.id!, r]));
    const currentById = new Map(rows.filter(r => r.id).map(r => [r.id!, r]));
    const created = rows
        .filter(r => r.id.startsWith('new_'))
        .map(r => ({
            company: r.company,
            role: r.role,
            accessTo: r.accessTo,
        }));

    const deleted = original
        .filter(r => r.id && !currentById.has(r.id))
        .map(r => r.id!);

    const updated = rows
        .filter(r => r.id && originalById.has(r.id))
        .map(r => {
            const prev = originalById.get(r.id!)!;
            const changed =
                prev.company !== r.company ||
                prev.role !== r.role ||
                JSON.stringify(prev.accessTo) !== JSON.stringify(r.accessTo);

            return changed
                ? { id: r.id!, company: r.company, role: r.role, accessTo: r.accessTo }
                : null;
        })
        .filter(Boolean) as RBAC[];

    await prisma.$transaction(async (tx) => {
        if (deleted.length) {
            await tx.rBAC.deleteMany({
                where: { id: { in: deleted } },
            });
        }

        for (const u of updated) {
            await tx.rBAC.update({
                where: { id: u.id },
                data: {
                    company: u.company ?? "",
                    role: u.role ?? "",
                    accessTo: u.accessTo,
                },
            });
        }

        if (created.length) {
            await tx.rBAC.createMany({
                data: created.map((c) => ({
                    role: c.role ?? "",
                    company: c.company ?? "",
                    accessTo: c.accessTo,
                })),
            });
        }
    });
}

export default async function AdminPage() {
    return (
        <>
            <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
                <h1 className="font-semibold">Access right configuration</h1>
            </div>
            <div className="flex-1 overflow-hidden">
                <AdminTable initialData={await fetchRBAC()} options={await loadRBACSelectOptions()} persistData={saveRBACConfig} />
            </div>
        </>
    );
}