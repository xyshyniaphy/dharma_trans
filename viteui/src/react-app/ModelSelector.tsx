import React, { useState, useRef, useEffect } from 'react';
import { Form, Dropdown, Button } from 'react-bootstrap';
import { OpenRouterModel } from './hooks/filterModels';

interface ModelSelectorProps {
    models: OpenRouterModel[];
    selectedModelIds: string[];
    onChange: (selectedIds: string[]) => void;
    disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
    models,
    selectedModelIds,
    onChange,
    disabled = false,
}) => {
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
            newSelectedIds = [...selectedModelIds, modelId];
        } else {
            newSelectedIds = selectedModelIds.filter(id => id !== modelId);
        }
        onChange(newSelectedIds);
    };

    const getSelectedModelsText = () => {
        if (selectedModelIds.length === 0) {
            return 'Select Models';
        }
        if (selectedModelIds.length === 1) {
            const model = models.find(m => m.id === selectedModelIds[0]);
            return model?.name || '1 model selected';
        }
        return `${selectedModelIds.length} models selected`;
    };

    return (
        <Dropdown show={isOpen} onToggle={handleToggle} ref={dropdownRef}>
            <Dropdown.Toggle variant="outline-secondary" id="model-selector-dropdown" disabled={disabled || models.length === 0}>
                {models.length === 0 ? 'Enter API Key First' : getSelectedModelsText()}
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {models.map((model) => (
                    <Dropdown.ItemText key={model.id} as="div">
                         <Form.Check
                            type="checkbox"
                            id={`model-checkbox-${model.id}`}
                            label={`${model.name} (${model.pricing?.prompt || 'N/A'})`}
                            checked={selectedModelIds.includes(model.id)}
                            onChange={(e) => handleCheckboxChange(model.id, e.target.checked)}
                        />
                    </Dropdown.ItemText>
                ))}
                 <Dropdown.Divider />
                 <Dropdown.ItemText>
                    <Button variant="link" size="sm" onClick={() => setIsOpen(false)}>Close</Button>
                 </Dropdown.ItemText>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default ModelSelector;
