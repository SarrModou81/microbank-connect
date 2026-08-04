import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-feature-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mbc-page">
      <div class="mbc-page-header">
        <div>
          <h1>{{ title }}</h1>
          <p>Ce module sera développé lors des prochaines étapes du projet.</p>
        </div>
      </div>
      <div class="mbc-card">
        <div class="mbc-empty">
          <i class="fa-solid fa-hammer"></i>
          <p>Module « {{ title }} » en construction.</p>
        </div>
      </div>
    </div>
  `,
})
export class FeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  title = this.route.snapshot.data['title'] ?? 'Module';
}