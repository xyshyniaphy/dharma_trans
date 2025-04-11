import React, { useState, useRef, useEffect } from 'react';
import { Form, Dropdown, Button } from 'react-bootstrap';
import { useModelsState } from './hooks/modelsHook';
import { useDTConfig } from './hooks/configHook'; // Import config hook

interface ModelSelectorProps {
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
}) => {
    const [models] = useModelsState();
    const { config, updateConfig } = useDTConfig(); // Use config hook
    const { selectedModels = [] } = config; // Get selectedModels from config, default to empty array

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Correct signature for onToggle: (nextShow: boolean, meta: ToggleMetadata) => void
    // ToggleMetadata has optional source and originalEvent
    const handleToggle = (nextShow: boolean, meta: { source?: string; originalEvent?: React.SyntheticEvent | Event }) => {
        // Allow closing via the toggle button itself or the explicit close button
        if (meta.source === 'toggle' || (meta.originalEvent?.target as HTMLElement)?.closest('button')?.textContent === 'Close') {
            setIsOpen(nextShow);
            return;
        }

        // Prevent closing when clicking inside the dropdown menu items (Form.Check)
        const clickedInsideMenu = dropdownRef.current && meta.originalEvent && dropdownRef.current.contains(meta.originalEvent.target as Node);

        if (clickedInsideMenu) {
             // Check if the click was on a checkbox or its label to keep it open
             const targetElement = meta.originalEvent?.target as HTMLElement;
             if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'LABEL') {
                 setIsOpen(true); // Keep open when interacting with checkboxes/labels
             } else {
                 // Allow closing if clicking elsewhere inside the menu (e.g., divider, padding)
                 // but only if the intent is to close (nextShow is false)
                 if (!nextShow) {
                    setIsOpen(false);
                 } else {
                    setIsOpen(true); // Keep open otherwise
                 }
             }
        } else {
            // Default behavior if clicked outside the menu
            setIsOpen(nextShow);
        }
    };

     // Close dropdown if clicked outside
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);


    const handleCheckboxChange = (modelId: string, checked: boolean) => {
        let newSelectedIds: string[];
        if (checked) {
            // Use selectedModels from config state
            newSelectedIds = [...selectedModels, modelId];
        } else {
            // Use selectedModels from config state
            newSelectedIds = selectedModels.filter(id => id !== modelId);
        }
        // Update global config state
        updateConfig({ selectedModels: newSelectedIds });
        // onChange(newSelectedIds); // Removed call to prop
    };

    const getSelectedModelsText = () => {
        // Use selectedModels from config state
        if (selectedModels.length === 0) {
            return 'Select Models';
        }
        if (selectedModels.length === 1) {
            const model = models?.find(m => m.id === selectedModels[0]);
            return model?.name || '1 model selected';
        }
        return `${selectedModels.length} models selected`;
    };

    // Add a check for models being loaded
    const modelsAvailable = models && models.length > 0;

    return (
        <Dropdown show={isOpen} onToggle={handleToggle} ref={dropdownRef}>
            {/* Use disabled prop passed from parent OR internal logic */}
            <Dropdown.Toggle variant="outline-primary" id="model-selector-dropdown" disabled={!modelsAvailable}>
                {!modelsAvailable ? 'Loading models...' : getSelectedModelsText()}
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {modelsAvailable ? models.map((model) => ( // Check modelsAvailable before mapping
                    <Dropdown.ItemText key={model.id} as="div">
                         <Form.Check
                            type="checkbox"
                            id={`model-checkbox-${model.id}`}
                            label={model.name}
                            // Use selectedModels from config state for checked status
                            checked={selectedModels.includes(model.id)}
                            onChange={(e) => handleCheckboxChange(model.id, e.target.checked)}
                        />
                    </Dropdown.ItemText>
                )) : <Dropdown.ItemText>No models available.</Dropdown.ItemText>}
                 <Dropdown.Divider />
                 <Dropdown.ItemText>
                    <Button variant="link" size="sm" onClick={() => setIsOpen(false)}>Close</Button>
                 </Dropdown.ItemText>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default ModelSelector;
