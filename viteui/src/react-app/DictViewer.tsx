import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Table, Form, Button } from 'react-bootstrap';
import Papa from 'papaparse';
// Import necessary types and hooks from react-table
import {
    useTable, 
    useFilters, 
    useGlobalFilter, 
    Column, 
    FilterProps,
    useAsyncDebounce // Import react-table's debounce hook
} from 'react-table';

// Type augmentation moved to src/react-table-config.d.ts

interface DictEntry {
    chinese: string;
    english: string;
}

interface DictViewerProps {
    show: boolean;
    onHide: () => void;
}

// Define a default UI for filtering using useAsyncDebounce
function DefaultColumnFilter({
    column: { filterValue, setFilter },
}: FilterProps<DictEntry>) {
    const [value, setValue] = useState(filterValue || '');

    // Debounce setFilter call for 500ms
    const debouncedSetFilter = useAsyncDebounce(val => {
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

    const apiUrl = import.meta.env.VITE_DHARMA_PROMPT_API_URL;
    const csvUrl = apiUrl ? `${apiUrl}/access/dic.csv` : null;

    useEffect(() => {
        if (show && csvUrl && data.length === 0) { // Fetch only when shown, URL exists, and data isn't loaded
            setLoading(true);
            setError(null);
            fetch(csvUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(csvText => {
                    Papa.parse<string[]>(csvText, {
                        header: false, // No header row
                        skipEmptyLines: true,
                        complete: (results) => {
                            const parsedData: DictEntry[] = results.data.map(row => ({
                                chinese: row[0] || '', // Handle potential undefined
                                english: row[1] || ''  // Handle potential undefined
                            }));
                            setData(parsedData);
                            setLoading(false);
                        },
                        error: (err: Error) => {
                            console.error("CSV parsing error:", err);
                            setError(`解析CSV失败: ${err.message}`); // Translate error
                            setLoading(false);
                        }
                    });
                })
                .catch(err => {
                    console.error("Failed to fetch dictionary:", err);
                    setError(`加载词典失败: ${err.message}`); // Translate error
                    setLoading(false);
                });
        } else if (!csvUrl && show) {
             setError("API URL (VITE_DHARMA_PROMPT_API_URL) 未配置。"); // Translate error
             setLoading(false);
        }
    }, [show, csvUrl, data.length]); // Rerun effect if show, csvUrl, or data.length changes

    const columns = useMemo<Column<DictEntry>[]>(() => [
        {
            Header: '中文', // Translate Header
            accessor: 'chinese',
            // Filter: DefaultColumnFilter, // Filter UI is now handled by defaultColumn
            filter: 'text', // Use the default text filter logic
        },
        {
            Header: '英文', // Translate Header
            accessor: 'english',
            // Filter: DefaultColumnFilter, // Filter UI is now handled by defaultColumn
            filter: 'text', // Use the default text filter logic
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
                {!loading && !error && csvUrl && (
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
                 {!csvUrl && <p className="text-warning">无法确定词典URL。请检查 VITE_DHARMA_PROMPT_API_URL 环境变量。</p>}
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
