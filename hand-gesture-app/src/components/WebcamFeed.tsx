import type { RefObject, ReactElement } from 'react';

interface WebcamFeedProps {
  videoRef: RefObject<HTMLVideoElement | null>;
}

const WebcamFeed = ({ videoRef }: WebcamFeedProps): ReactElement => (
  <video ref={videoRef} className="video-feed" style={{ display: 'none' }} />
);

export default WebcamFeed;
