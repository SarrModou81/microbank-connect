import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface BarChartItem {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="mbc-bar-chart">
      @for (item of data(); track item.label) {
        <div class="mbc-bar-row">
          <span class="mbc-bar-label">{{ item.label }}</span>
          <div class="mbc-bar-track">
            <div class="mbc-bar-fill" [style.width.%]="pourcentage(item.value)" [style.background]="item.color"></div>
          </div>
          <span class="mbc-bar-value">{{ item.value | number: '1.0-0' }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .mbc-bar-chart { display: flex; flex-direction: column; gap: 0.9rem; }
    .mbc-bar-row { display: grid; grid-template-columns: 110px 1fr 80px; align-items: center; gap: 0.75rem; }
    .mbc-bar-label { font-size: 0.82rem; font-weight: 600; color: var(--mbc-text-muted); }
    .mbc-bar-track { height: 10px; background: #eef0f6; border-radius: 999px; overflow: hidden; }
    .mbc-bar-fill { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
    .mbc-bar-value { font-size: 0.82rem; font-weight: 700; color: var(--mbc-text); text-align: right; }
  `],
})
export class BarChartComponent {
  data = input.required<BarChartItem[]>();

  private maxValue = computed(() => Math.max(...this.data().map((d) => d.value), 1));

  pourcentage(value: number): number {
    return Math.round((value / this.maxValue()) * 100);
  }
}