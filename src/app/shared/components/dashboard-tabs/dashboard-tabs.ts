import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabItem } from '../../models/TabItem';

@Component({
  selector: 'app-dashboard-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-tabs.component.html',
})
export class DashboardTabsComponent {
  // Inputs
  tabs = input.required<TabItem[]>();
  activeTab = input.required<string>();
  color = input<string>('purple'); // Couleur du thème: 'purple', 'indigo', 'blue', etc.

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
