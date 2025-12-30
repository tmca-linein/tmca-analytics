'use client';

import { useRouter } from "next/navigation";
import { DataTable } from '../../components/table/data-table';
import { getColumns } from './tableColumns';
import { User } from '@/types/user';

interface Props {
    initialData: User[];
}

export const UsersTable: React.FC<Props> = ({ initialData }) => {
    const router = useRouter();
    const columns = getColumns();

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
                getRowClassName: () => "hover:bg-sidebar/10 dark:hover:bg-sidebar"
            }}
        />
    );
};



