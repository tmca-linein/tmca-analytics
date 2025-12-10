'use client';

import { useState } from 'react';
import { DataTable } from '../../components/table/data-table';
import { getColumns } from './tableColumns';
import { User } from '@/types/user';

interface Props {
    initialData: User[];
}

export const UsersTable: React.FC<Props> = ({ initialData }) => {
    const [data, setData] = useState<User[]>(initialData);
    const columns = getColumns();

    return (
        <DataTable
            columns={columns}
            data={data}
            meta={{
                onRowExpand: undefined,
                loadingRows: undefined,
                getRowClassName: undefined
            }}
        />
    );
};



