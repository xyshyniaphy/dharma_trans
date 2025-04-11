import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export default function TopicEdit({ show, onClose, currentName, onSave }: {
  show: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => void;
}) {
  const [name, setName] = useState(currentName);

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>重命名主题</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          placeholder="输入新的主题名称"
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          取消
        </Button>
        <Button 
          variant="primary" 
          onClick={() => name.trim() && onSave(name)}
          disabled={!name.trim()}
        >
          保存
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
