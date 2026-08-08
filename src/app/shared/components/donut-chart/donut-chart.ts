import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface DonutChartItem {
  label: string;
  value: number;
  color: string;
}

interface Segment extends DonutChartItem {
  dashArray: string;
  dashOffset: number;
  pourcentage: number;
}

const CIRCONFERENCE = 2 * Math.PI * 40;

@Component({
  selector: 'app-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="mbc-donut-wrap">
      <svg viewBox="0 0 100 100" class="mbc-donut-svg">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#eef0f6" stroke-width="14" />
        @for (segment of segments(); track segment.label) {
          <circle
            cx="50" cy="50" r="40" fill="none"
            [attr.stroke]="segment.color" stroke-width="14"
            [attr.stroke-dasharray]="segment.dashArray"
            [attr.stroke-dashoffset]="segment.dashOffset"
            transform="rotate(-90 50 50)"
            stroke-linecap="round"
          />
        }
        <text x="50" y="47" text-anchor="middle" class="mbc-donut-total-value">{{ total() | number: '1.0-0' }}</text>
        <text x="50" y="60" text-anchor="middle" class="mbc-donut-total-label">Total</text>
      </svg>
      <div class="mbc-donut-legend">
        @for (segment of segments(); track segment.label) {
          <div class="mbc-donut-legend-item">
            <span class="mbc-donut-dot" [style.background]="segment.color"></span>
            <span>{{ segment.label }}</span>
            <span class="mbc-donut-legend-value">{{ segment.pourcentage }}%</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .mbc-donut-wrap { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
    .mbc-donut-svg { width: 140px; height: 140px; flex-shrink: 0; }
    .mbc-donut-total-value { font-size: 13px; font-weight: 800; fill: var(--mbc-text); font-family: var(--mbc-font-heading); }
    .mbc-donut-total-label { font-size: 6px; fill: var(--mbc-text-muted); font-weight: 600; text-transform: uppercase; }
    .mbc-donut-legend { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 140px; }
    .mbc-donut-legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--mbc-text); }
    .mbc-donut-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
    .mbc-donut-legend-value { margin-left: auto; font-weight: 700; }
  `],
})
export class DonutChartComponent {
  data = input.required<DonutChartItem[]>();

  total = computed(() => this.data().reduce((sum, d) => sum + d.value, 0) || 1);

  segments = computed<Segment[]>(() => {
    let cumulativePourcentage = 0;
    return this.data().map((item) => {
      const pourcentage = Math.round((item.value / this.total()) * 100);
      const dashArray = `${(item.value / this.total()) * CIRCONFERENCE} ${CIRCONFERENCE}`;
      const dashOffset = -((cumulativePourcentage / 100) * CIRCONFERENCE);
      cumulativePourcentage += pourcentage;
      return { ...item, dashArray, dashOffset, pourcentage };
    });
  });
}