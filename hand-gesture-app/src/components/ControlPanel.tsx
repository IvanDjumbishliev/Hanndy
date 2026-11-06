import { memo } from 'react';
import type { ChangeEvent, Dispatch, ReactElement, SetStateAction } from 'react';
import type { DrawingControlsProps } from './DrawingControls';
import DrawingControls from './DrawingControls';
import VisualizationControls from './VisualizationControls';
import '../styles/ControlPanel.css';

interface ControlPanelProps extends DrawingControlsProps {
  showSkeleton: boolean;
  setShowSkeleton: Dispatch<SetStateAction<boolean>>;
  isNeon: boolean;
  setIsNeon: Dispatch<SetStateAction<boolean>>;
  showGrid: boolean;
  setShowGrid: Dispatch<SetStateAction<boolean>>;
  autoRotate: boolean;
  setAutoRotate: Dispatch<SetStateAction<boolean>>;
  showHistory: boolean;
  setShowHistory: Dispatch<SetStateAction<boolean>>;
  showStats: boolean;
  setShowStats: Dispatch<SetStateAction<boolean>>;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  voiceVolume: number;
  setVoiceVolume: (volume: number) => void;
  undo: () => void;
  clearCanvas: () => void;
  saveImage: () => void;
  export3D: () => void;
}

const ControlPanel = (props: ControlPanelProps): ReactElement => {
  const { showHistory, setShowHistory, showStats, setShowStats } = props;
  const { activeTool, setActiveTool, brushColor, setBrushColor, brushSize, setBrushSize,
    isDynamicSize, setIsDynamicSize, viewMode, setViewMode } = props;
  const visualizationProps = {
    showSkeleton: props.showSkeleton, setShowSkeleton: props.setShowSkeleton, viewMode,
    isNeon: props.isNeon, setIsNeon: props.setIsNeon, showGrid: props.showGrid,
    setShowGrid: props.setShowGrid, autoRotate: props.autoRotate, setAutoRotate: props.setAutoRotate,
    undo: props.undo, clearCanvas: props.clearCanvas, saveImage: props.saveImage, export3D: props.export3D,
  };

  return (
    <div className="control-panel glassmorphism">
      <div className="panel-header"><h2>Air Draw <span>Pro</span></h2></div>
      <DrawingControls {...{
        activeTool, setActiveTool, brushColor, setBrushColor, brushSize, setBrushSize,
        isDynamicSize, setIsDynamicSize, viewMode, setViewMode,
      }} />
      <VisualizationControls {...visualizationProps} />
      <section className="control-group">
        <h3>Panels</h3>
        <PanelToggle label="Show Gesture History" checked={showHistory} onChange={setShowHistory} />
        <PanelToggle label="Show performance stats" checked={showStats} onChange={setShowStats} />
      </section>
      <section className="control-group">
        <h3>Audio</h3>
        <PanelToggle
          label="Voice feedback"
          checked={props.voiceEnabled}
          onChange={props.setVoiceEnabled}
        />
        <label className="voice-volume">
          <span>Volume</span>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={props.voiceVolume}
            onChange={(event: ChangeEvent<HTMLInputElement>): void =>
              props.setVoiceVolume(Number(event.target.value))}
          />
          <output>{props.voiceVolume}%</output>
        </label>
      </section>
      <section className="control-group">
        <h3>Gesture Actions</h3>
        <p className="gesture-action">Pinch <span>→ Draw</span></p>
        <p className="gesture-action">Fist <span>→ Undo</span></p>
      </section>
    </div>
  );
};

interface PanelToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const PanelToggle = ({ label, checked, onChange }: PanelToggleProps): ReactElement => (
  <label className="checkbox-container">
    <input type="checkbox" checked={checked}
      onChange={(event: ChangeEvent<HTMLInputElement>): void => onChange(event.target.checked)} />
    <span>{label}</span>
  </label>
);

export default memo(ControlPanel);
