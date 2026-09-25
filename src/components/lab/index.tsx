import type { ComponentType, JSX } from 'react';
import './lab.css';
import TopographyDemo from './TopographyDemo';
import DiffractionDemo from './DiffractionDemo';
import ParticlesDemo from './ParticlesDemo';
import ShaderDemo from './ShaderDemo';
import OverlayDemo from './OverlayDemo';
import NanosheetDemo from './NanosheetDemo';

const registry: Record<string, ComponentType> = {
  topography: TopographyDemo,
  diffraction: DiffractionDemo,
  particles: ParticlesDemo,
  shader: ShaderDemo,
  overlay: OverlayDemo,
  nanosheet: NanosheetDemo,
};

export function LabDemo({ demo }: { demo: string }): JSX.Element | null {
  const Component = registry[demo];
  return Component ? <Component /> : null;
}
