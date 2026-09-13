import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { TabItem } from '../../models/TabItem';

@Component({
  selector: 'app-dashboard-tabs',
  standalone: true,
  imports: [],
  templateUrl: './dashboard-tabs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTabs {
  // Inputs
  tabs = input.required<TabItem[]>();
  activeTab = input.required<string>();
  color = input<string>('blue'); // Couleur du thème: 'blue', 'indigo', etc.

  // Outputs
  tabChange = output<string>();

  // État du menu mobile
  showMenu = signal(false);

  toggleMenu() {
    this.showMenu.update((v) => !v);
  }

  selectTab(tabId: string) {
    this.tabChange.emit(tabId);
    this.showMenu.set(false); // Ferme le menu après sélection
  }

  getActiveTabLabel(): string {
    const activeTabItem = this.tabs().find((t) => t.id === this.activeTab());
    return activeTabItem?.mobileLabel || activeTabItem?.label || '';
  }
}
