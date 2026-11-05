import { createElement, useRef } from 'react';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import useHandGesture from './useHandGesture';

describe('useHandGesture', (): void => {
  it('returns isLoading true initially', (): void => {
    const HookProbe = (): ReactElement =>
      createElement('span', null, String(useHandGesture(useRef<HTMLVideoElement>(null)).isLoading));

    expect(renderToString(createElement(HookProbe))).toBe('<span>true</span>');
  });
});
