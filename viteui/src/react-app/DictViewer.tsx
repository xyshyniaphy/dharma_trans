import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Table, Form, Button } from 'react-bootstrap';
import { fetchTransData } from './utils/translate_tool'; // 使用 fetchTransData 获取字典
// Import necessary types and hooks from react-table
import {
    useTable, 
    useFilters,
    useGlobalFilter,
    Column,
    FilterProps
} from 'react-table';
import { useDebouncedCallback } from './hooks/useDebounce'; // Import custom hook
import type { DictEntry } from './interface/trans_data'; // 直接使用原始 DictEntry 类型

// Type augmentation moved to src/react-table-config.d.ts

interface DictViewerProps {
    show: boolean;
    onHide: () => void;
}

// Define a default UI for filtering using useAsyncDebounce
function DefaultColumnFilter({
    column: { filterValue, setFilter },
}: FilterProps<DictEntry>) {
    const [value, setValue] = useState(filterValue || '');

    // Debounce setFilter call for 500ms using the custom hook
    const debouncedSetFilter = useDebouncedCallback((val: string) => {
        setFilter(val || undefined); // Set undefined to remove the filter entirely
    }, 500);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue); // Update local state immediately for responsive input
        debouncedSetFilter(newValue); // Trigger the debounced filter update
    };

    return (
        <Form.Control
            value={value}
            onChange={handleChange}
            placeholder={`搜索...`} // Simplified placeholder
            size="sm"
            className="mt-1"
        />
    );
}


const DictViewer: React.FC<DictViewerProps> = ({ show, onHide }) => {
    const [data, setData] = useState<DictEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

  //do not add dependency to useEffect
    useEffect(() => {
        // 当组件显示且尚未加载数据时，使用 fetchTransData 获取字典数据
        if (show && data.length === 0) {
            setLoading(true);
            setError(null);
            fetchTransData()
                .then(transData => {
                    setData(transData.dict); // 直接使用原始 dict，无需 map
                })
                .catch(err => {
                    console.error('获取字典失败:', err);
                    setError(`加载词典失败: ${err.message}`);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [show, data.length]); // Rerun effect if show, csvUrl, or data.length changes

    const columns = useMemo<Column<DictEntry>[]>(() => [
        {
            Header: '中文', // Translate Header
            accessor: 'cn',
            filter: 'text',
        },
        {
            Header: '英文', // Translate Header
            accessor: 'en',
            filter: 'text',
        },
    ], []);

    // Define defaultColumn directly, relying on type augmentation for Filter property
    // Apply the custom debounced filter to all columns by default
    const defaultColumn = useMemo(() => ({
        Filter: DefaultColumnFilter,
    }), []);


    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable<DictEntry>(
        {
            columns,
            data,
            defaultColumn, // Be sure to pass the defaultColumn option
            // filterTypes, // Removed - default types are usually sufficient
            // The debounced DefaultColumnFilter handles *when* setFilter is called.
            // react-table will automatically filter when filterValue changes.
        },
        useFilters, // Use the useFilters plugin hook
        useGlobalFilter // Use the useGlobalFilter plugin hook (optional, for global search)
    );

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>词典查看器</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {loading && <p>正在加载词典...</p>}
                {error && <p className="text-danger">{error}</p>}
                {!loading && !error && (
                     <Table striped bordered hover responsive {...getTableProps()} size="sm">
                        <thead>
                            {headerGroups.map(headerGroup => (
                                <tr {...headerGroup.getHeaderGroupProps()}>
                                    {/* Remove incorrect cast, rely on augmentation for column properties */}
                                    {headerGroup.headers.map(column => ( 
                                        <th {...column.getHeaderProps()}>
                                            {column.render('Header')}
                                            {/* Render the columns filter UI */}
                                            {/* Check if column.canFilter exists before rendering */}
                                            <div>{column.canFilter ? column.render('Filter') : null}</div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody {...getTableBodyProps()}>
                            {rows.map(row => {
                                prepareRow(row);
                                return (
                                    <tr {...row.getRowProps()}>
                                        {row.cells.map(cell => { // Use inferred type or Cell<DictEntry>
                                            // cell object has getCellProps and render methods
                                            return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    关闭 
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DictViewer;
