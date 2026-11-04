import { useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import type { ReactElement, Ref } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

interface Point3D {
    x: number;
    y: number;
    z: number;
}

interface DrawingLine3D {
    points: Point3D[];
    color: string;
    size: number;
}

interface LineProps extends DrawingLine3D {
    isNeon: boolean;
}

interface ActiveLineProps {
    points: Point3D[];
    color: string;
    size: number;
}

interface Scene3DProps {
    lines: DrawingLine3D[];
    activeLine: Point3D[];
    brushColor: string;
    brushSize: number;
    isNeon: boolean;
    showGrid: boolean;
    autoRotate: boolean;
}

export interface Scene3DHandle {
    exportScene: () => void;
}

const Line = ({ points, color, size }: LineProps): ReactElement => {
    const geometry = useMemo((): THREE.BufferGeometry => {
        const pts = points.map((point: Point3D): THREE.Vector3 => new THREE.Vector3(point.x, point.y, point.z));
        return new THREE.BufferGeometry().setFromPoints(pts);
    }, [points]);

    return (
        <threeLine geometry={geometry}>
            <lineBasicMaterial
                color={color}
                linewidth={size}
                toneMapped={false}
            />
        </threeLine>
    );
};

const ActiveLine = ({ points, color, size }: ActiveLineProps): ReactElement => {
    const geometry = useMemo((): THREE.BufferGeometry => {
        const pts = points.map((point: Point3D): THREE.Vector3 => new THREE.Vector3(point.x, point.y, point.z));
        return new THREE.BufferGeometry().setFromPoints(pts);
    }, [points]);

    return (
        <threeLine geometry={geometry}>
            <lineBasicMaterial color={color} linewidth={size} toneMapped={false} />
        </threeLine>
    );
};

const Scene3D = forwardRef<Scene3DHandle, Scene3DProps>(
    ({ lines, activeLine, brushColor, brushSize, isNeon, showGrid, autoRotate }, ref: Ref<Scene3DHandle>): ReactElement => {
    const groupRef = useRef<THREE.Group | null>(null);

    useImperativeHandle(ref, (): Scene3DHandle => ({
        exportScene: (): void => {
            if (!groupRef.current) return;
            const exporter = new GLTFExporter();
            exporter.parse(groupRef.current, (result: ArrayBuffer | { [key: string]: unknown }): void => {
                const output = JSON.stringify(result, null, 2);
                const blob = new Blob([output], { type: 'text/plain' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `air-draw-model-${Date.now()}.glb`;
                link.click();
            }, (error: ErrorEvent): void => {
                console.error('Failed to export 3D scene', error);
            });
        }
    }));

    return (
        <div className="scene-3d-container" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            <Canvas gl={{ toneMapping: THREE.NoToneMapping }}>
                <PerspectiveCamera makeDefault position={[0, 0, 15]} />
                <OrbitControls
                    makeDefault
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    autoRotate={autoRotate}
                    autoRotateSpeed={2.0}
                />

                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                <group ref={groupRef}>
                    {lines.map((line: DrawingLine3D, index: number) => (
                        <Line key={index} points={line.points} color={line.color} size={line.size} isNeon={isNeon} />
                    ))}
                    {activeLine.length > 0 && (
                        <ActiveLine points={activeLine} color={brushColor} size={brushSize} />
                    )}
                </group>

                {showGrid && <gridHelper args={[20, 20, 0x555555, 0x333333]} rotation={[0, 0, 0]} />}

                {isNeon && (
                    <EffectComposer>
                        <Bloom
                            intensity={1.5}
                            luminanceThreshold={0}
                            luminanceSmoothing={0.9}
                            height={300}
                        />
                    </EffectComposer>
                )}
            </Canvas>
        </div>
    );
});

export default Scene3D;
