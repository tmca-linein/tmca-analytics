'use client';

import { useRouter } from "next/navigation";
import { DataTable } from '../../components/table/data-table';
import { getColumns } from './tableColumns';
import { User } from '@/types/user';

interface Props {
    initialData: User[];
    spaceUsers?: boolean;
}

export const UsersTable: React.FC<Props> = ({ initialData, spaceUsers }) => {
    const router = useRouter();
    let columns = getColumns();
    if (spaceUsers) {
        columns = columns.map(c => {
            if ('accessorKey' in c) {
                const key = c.accessorKey as string;
                if (key === 'anfAddedDay') return { ...c, header: 'ANF-ADDED Yesterday' };
                if (key === 'anfRemovedDay') return { ...c, header: 'ANF-REMOVED Yesterday' };
                if (key === 'countDay') return { ...c, header: 'Comments-ADDED Yesterday' };
                if (key === 'avgWordCountDay') return { ...c, header: 'Comment-AVG-Length Yesterday' };
            }
            return c;
        });
    }

    const rowClickEvent = (id: string) => {
        router.push(`/users/${id}`);
    }

    return (
        <DataTable
            columns={columns}
            data={initialData}
            meta={{
                onRowClicked: rowClickEvent,
                loadingRows: undefined,
                getRowClassName: () => "bg-background hover:bg-sidebar-light dark:hover:bg-sidebar-light"
            }}
        />
    );
};



