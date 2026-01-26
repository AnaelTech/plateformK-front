export interface TabItem {
  id: string; // ID unique de l'onglet
  label: string; // Texte complet
  icon: string; // SVG path (heroicons)
  mobileLabel?: string; // Label court pour mobile (optionnel)
}
