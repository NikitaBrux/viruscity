import { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { District, InfectionLevel } from '../types';
import { useGameStore } from '../store/gameStore';

const TILE = 56;
const COLS = 8;
const ROWS = 8;
const PAD = 8;

const INFECTION_COLOR: Record<InfectionLevel, number> = {
  healthy: 0x1a2a1a,
  half_zombie: 0x4a2a00,
  zombie: 0x3a0000,
};

const BUILDING_EMOJI: Record<string, string> = {
  house: '🏠',
  hospital: '🏥',
  factory: '🏭',
  lab: '🔬',
  market: '🏪',
};

const INFECTION_EMOJI: Record<InfectionLevel, string> = {
  healthy: '',
  half_zombie: '🤒',
  zombie: '🧟',
};

interface Props {
  width: number;
  height: number;
}

export function CityScene({ width, height }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const tilesRef = useRef<Map<string, PIXI.Container>>(new Map());

  const { city, selectDistrict, selectedDistrict } = useGameStore();

  const drawTile = useCallback(
    (container: PIXI.Container, district: District, isSelected: boolean) => {
      container.removeChildren();

      const bg = new PIXI.Graphics();
      const color = INFECTION_COLOR[district.infection_level];
      const borderColor = isSelected ? 0x00ff88 : 0x2a3a2a;
      const borderWidth = isSelected ? 3 : 1;

      bg.lineStyle(borderWidth, borderColor, 1);
      bg.beginFill(color, 0.9);
      bg.drawRoundedRect(2, 2, TILE - 4, TILE - 4, 6);
      bg.endFill();
      container.addChild(bg);

      // Building emoji
      if (district.building) {
        const buildingText = new PIXI.Text(BUILDING_EMOJI[district.building], {
          fontSize: 22,
          align: 'center',
        });
        buildingText.anchor.set(0.5);
        buildingText.x = TILE / 2;
        buildingText.y = TILE / 2 - 6;
        container.addChild(buildingText);

        if (district.building_level > 1) {
          const lvlText = new PIXI.Text(`Lv${district.building_level}`, {
            fontSize: 9,
            fill: 0xaaaaaa,
          });
          lvlText.anchor.set(0.5);
          lvlText.x = TILE / 2;
          lvlText.y = TILE - 10;
          container.addChild(lvlText);
        }
      }

      // Infection indicator
      const infEmoji = INFECTION_EMOJI[district.infection_level];
      if (infEmoji) {
        const infText = new PIXI.Text(infEmoji, { fontSize: 14 });
        infText.x = TILE - 20;
        infText.y = 2;
        container.addChild(infText);
      }

      // Empty tile hint
      if (!district.building && district.infection_level === 'healthy') {
        const plus = new PIXI.Text('+', {
          fontSize: 20,
          fill: 0x334433,
          align: 'center',
        });
        plus.anchor.set(0.5);
        plus.x = TILE / 2;
        plus.y = TILE / 2;
        container.addChild(plus);
      }
    },
    []
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x0a0a0f,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    canvasRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    const cityContainer = new PIXI.Container();
    app.stage.addChild(cityContainer);

    // Center the grid
    const gridW = COLS * TILE + (COLS - 1) * PAD;
    const gridH = ROWS * TILE + (ROWS - 1) * PAD;
    cityContainer.x = (width - gridW) / 2;
    cityContainer.y = (height - gridH) / 2 + 20;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const container = new PIXI.Container();
        container.x = col * (TILE + PAD);
        container.y = row * (TILE + PAD);
        container.interactive = true;
        container.cursor = 'pointer';

        const id = `${col}:${row}`;
        container.on('pointerdown', () => {
          useGameStore.getState().selectDistrict(
            useGameStore.getState().selectedDistrict === id ? null : id
          );
        });

        cityContainer.addChild(container);
        tilesRef.current.set(id, container);
      }
    }

    return () => {
      app.destroy(true, { children: true });
      appRef.current = null;
      tilesRef.current.clear();
    };
  }, [width, height]);

  // Redraw when city or selection changes
  useEffect(() => {
    if (!city) return;
    city.districts.forEach((district) => {
      const container = tilesRef.current.get(district.id);
      if (container) {
        drawTile(container, district, selectedDistrict === district.id);
      }
    });
  }, [city, selectedDistrict, drawTile]);

  return <div ref={canvasRef} style={{ width, height }} />;
}
