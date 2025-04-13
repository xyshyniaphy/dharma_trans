import { Button } from 'react-bootstrap';
import Navbar from 'react-bootstrap/Navbar';
import DNavBarThemeDrop from './DNavBarThemeDrop';
// Import FontAwesomeIcon and necessary icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faCog } from '@fortawesome/free-solid-svg-icons';

interface DNavBarProps {
  showLeftPanel: boolean;
  setShowLeftPanel: (show: boolean) => void;
  setShowConfigModal: (show: boolean) => void;
}

export function DNavBar({ showLeftPanel, setShowLeftPanel, setShowConfigModal }: DNavBarProps) {
  return (
    <Navbar expand="lg">
      {/* Add icon to History button */}
      <Button onClick={() => setShowLeftPanel(!showLeftPanel)}>
        <FontAwesomeIcon icon={faHistory} style={{ marginRight: '5px' }} />
        历史记录
      </Button>
      <Navbar.Brand style={{ flex: 1, textAlign: 'center' }}>智能翻译 - Darma Translate</Navbar.Brand>
      <DNavBarThemeDrop />
      {/* Add icon to Settings button */}
      <Button onClick={() => setShowConfigModal(true)} style={{ marginLeft: '8px' }}>
        <FontAwesomeIcon icon={faCog} style={{ marginRight: '5px' }} />
        设置
      </Button>
    </Navbar>
  );
}
