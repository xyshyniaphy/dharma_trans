import { Button } from 'react-bootstrap';
import Navbar from 'react-bootstrap/Navbar';
import DNavBarThemeDrop from './DNavBarThemeDrop';

interface DNavBarProps {
  showLeftPanel: boolean;
  setShowLeftPanel: (show: boolean) => void;
  setShowConfigModal: (show: boolean) => void;
}

export function DNavBar({ showLeftPanel, setShowLeftPanel, setShowConfigModal }: DNavBarProps) {
  return (
    <Navbar expand="lg">
      <Button onClick={() => setShowLeftPanel(!showLeftPanel)}>历史记录</Button>
      <Navbar.Brand style={{ flex: 1, textAlign: 'center' }}>中文智能翻译 - Darma Translate</Navbar.Brand>
      <DNavBarThemeDrop />
      <Button onClick={() => setShowConfigModal(true)}>设置</Button>
    </Navbar>
  );
}
