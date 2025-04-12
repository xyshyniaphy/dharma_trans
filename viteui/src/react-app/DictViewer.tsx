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
    ColumnInstance, 
    HeaderGroup, 
    Cell,
    // Import hook-specific types for augmentation
    UseFiltersColumnOptions,
    UseFiltersColumnProps,
    UseFiltersInstanceProps,
    UseFiltersOptions,
    UseFiltersState,
    UseGlobalFiltersColumnOptions,
    UseGlobalFiltersInstanceProps,
    UseGlobalFiltersOptions,
    UseGlobalFiltersState,
    TableOptions,
    TableInstance,
    TableState,
    ColumnInterface,
    Row
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

// Define a default UI for filtering
// Use FilterProps as originally intended
function DefaultColumnFilter({
    column: { filterValue, preFilteredRows, setFilter },
}: FilterProps<DictEntry>) {
    const count = preFilteredRows.length;

    return (
        <Form.Control
            value={filterValue || ''}
            onChange={e => {
                setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
            }}
            placeholder={`Search ${count} records...`}
            size="sm" // Make filter input smaller
            className="mt-1" // Add some margin top
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
                            setError(`Failed to parse CSV: ${err.message}`);
                            setLoading(false);
                        }
                    });
                })
                .catch(err => {
                    console.error("Failed to fetch dictionary:", err);
                    setError(`Failed to load dictionary: ${err.message}`);
                    setLoading(false);
                });
        } else if (!csvUrl && show) {
             setError("API URL (VITE_DHARMA_PROMPT_API_URL) is not configured.");
             setLoading(false);
        }
    }, [show, csvUrl, data.length]); // Rerun effect if show, csvUrl, or data.length changes

    const columns = useMemo<Column<DictEntry>[]>(() => [
        {
            Header: 'Chinese',
            accessor: 'chinese',
            Filter: DefaultColumnFilter, // Add filter UI
            filter: 'text', // Use the default text filter logic
        },
        {
            Header: 'English',
            accessor: 'english',
            Filter: DefaultColumnFilter, // Add filter UI
            filter: 'text', // Use the default text filter logic
        },
    ], []);

    const defaultColumn = useMemo(() => ({
        // Let's set up our default Filter UI
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
        },
        useFilters, // Use the useFilters plugin hook
        useGlobalFilter // Use the useGlobalFilter plugin hook (optional, for global search)
    );

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Dictionary Viewer</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {loading && <p>Loading dictionary...</p>}
                {error && <p className="text-danger">{error}</p>}
                {!loading && !error && csvUrl && (
                     <Table striped bordered hover responsive {...getTableProps()} size="sm">
                        <thead>
                            {headerGroups.map(headerGroup => (
                                <tr {...headerGroup.getHeaderGroupProps()}>
                                    {/* Explicitly type the column parameter */}
                                    {headerGroup.headers.map((column: ColumnInstance<DictEntry>) => ( 
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
                 {!csvUrl && <p className="text-warning">Dictionary URL could not be determined. Check VITE_DHARMA_PROMPT_API_URL environment variable.</p>}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DictViewer;
