import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
} from 'three';
import type { HandLandmark } from '../types/gestures';
import styles from './HandModel3D.module.css';

interface HandModel3DProps {
  landmarks: HandLandmark[] | null;
}

const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const CYAN = 0x00f5ff;

const HandModel3D = ({ landmarks }: HandModel3DProps): ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarksRef = useRef(landmarks);
  const sceneRef = useRef<Scene | null>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const handGroupRef = useRef<Group | null>(null);
  const handMeshesRef = useRef<Mesh<SphereGeometry, MeshBasicMaterial>[]>([]);
  const lineGeometryRef = useRef<BufferGeometry | null>(null);
  const placeholderRef = useRef<LineSegments | null>(null);

  useEffect((): (() => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return (): void => {};

    const scene = new Scene();
    const camera = new PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 2;
    scene.add(new AmbientLight(CYAN, 0.3));
    const pointLight = new PointLight(CYAN, 1);
    pointLight.position.set(1, 1, 1);
    scene.add(pointLight);

    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(240, 240, false);
    renderer.setClearColor(0x000000, 0);

    const handGroup = new Group();
    const handMeshes: Mesh<SphereGeometry, MeshBasicMaterial>[] = Array.from(
      { length: 21 },
      (): Mesh<SphereGeometry, MeshBasicMaterial> => {
      const geometry = new SphereGeometry(0.025);
      const material = new MeshBasicMaterial({ color: CYAN });
      const mesh = new Mesh(geometry, material);
      handGroup.add(mesh);
      return mesh;
      },
    );

    const lineGeometry = new BufferGeometry();
    const linePositions = new Float32Array(HAND_CONNECTIONS.length * 2 * 3);
    const positionAttribute = new BufferAttribute(linePositions, 3);
    positionAttribute.setUsage(DynamicDrawUsage);
    lineGeometry.setAttribute('position', positionAttribute);
    const lineMaterial = new LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.7 });
    handGroup.add(new LineSegments(lineGeometry, lineMaterial));
    scene.add(handGroup);

    const placeholderSphereGeometry = new SphereGeometry(0.5, 12, 8);
    const placeholderGeometry = new WireframeGeometry(placeholderSphereGeometry);
    const placeholderMaterial = new LineBasicMaterial({ color: CYAN });
    const placeholder = new LineSegments(placeholderGeometry, placeholderMaterial);
    scene.add(placeholder);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    handGroupRef.current = handGroup;
    handMeshesRef.current = handMeshes;
    lineGeometryRef.current = lineGeometry;
    placeholderRef.current = placeholder;
    handGroup.visible = landmarksRef.current !== null && landmarksRef.current.length >= 21;
    placeholder.visible = !handGroup.visible;

    let animationFrame = 0;
    const animate = (): void => {
      if (landmarksRef.current === null) {
        handGroup.rotation.y += 0.003;
        placeholder.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);

    return (): void => {
      window.cancelAnimationFrame(animationFrame);
      for (const mesh of handMeshes) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      lineGeometry.dispose();
      lineMaterial.dispose();
      placeholderGeometry.dispose();
      placeholderSphereGeometry.dispose();
      placeholderMaterial.dispose();
      renderer.dispose();
      scene.clear();
      sceneRef.current = null;
      rendererRef.current = null;
      handGroupRef.current = null;
      handMeshesRef.current = [];
      lineGeometryRef.current = null;
      placeholderRef.current = null;
    };
  }, []);

  useEffect((): void => {
    landmarksRef.current = landmarks;
    const activeLandmarks = landmarks !== null && landmarks.length >= 21;
    const handGroup = handGroupRef.current;
    const placeholder = placeholderRef.current;
    if (handGroup) handGroup.visible = activeLandmarks;
    if (placeholder) placeholder.visible = !activeLandmarks;
    if (!activeLandmarks) return;

    for (const [index, landmark] of landmarks.entries()) {
      const mesh = handMeshesRef.current[index];
      if (!mesh) continue;
      const position = toWorldPosition(landmark);
      mesh.position.set(position.x, position.y, position.z);
    }

    const positionAttribute = lineGeometryRef.current?.getAttribute('position');
    if (!(positionAttribute instanceof BufferAttribute)) return;
    let vertexIndex = 0;
    for (const [startIndex, endIndex] of HAND_CONNECTIONS) {
      const start = landmarks[startIndex];
      const end = landmarks[endIndex];
      if (!start || !end) continue;
      const startPosition = toWorldPosition(start);
      const endPosition = toWorldPosition(end);
      positionAttribute.setXYZ(vertexIndex, startPosition.x, startPosition.y, startPosition.z);
      positionAttribute.setXYZ(vertexIndex + 1, endPosition.x, endPosition.y, endPosition.z);
      vertexIndex += 2;
    }
    positionAttribute.needsUpdate = true;
    positionAttribute.clearUpdateRanges();
    positionAttribute.addUpdateRange(0, HAND_CONNECTIONS.length * 2 * 3);
  }, [landmarks]);

  return (
    <aside className={styles.panel} aria-label="3D hand model">
      <div className={styles.label}>HAND MODEL</div>
      <canvas className={styles.canvas} ref={canvasRef} />
    </aside>
  );
};

const toWorldPosition = (landmark: HandLandmark): Vector3 =>
  new Vector3(-(landmark.x - 0.5) * 2, -(landmark.y - 0.5) * 2, -landmark.z * 1.5);

export default HandModel3D;
