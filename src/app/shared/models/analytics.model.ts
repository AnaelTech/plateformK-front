/**
 * Modèles pour les statistiques et analytics
 */

/**
 * Statistiques avancées de réservation
 */
export interface EnhancedBookingStats {
  // Compteurs de base
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;

  // Métriques de revenus
  totalRevenue: number;
  pendingRevenue: number;
  averageBookingValue: number;

  // Taux de performance (en pourcentage, 0-100)
  confirmationRate: number;
  completionRate: number;
  cancellationRate: number;

  // Statistiques par matière (matière -> nombre de bookings)
  bookingsBySubject: Record<string, number>;

  // Statistiques par période
  bookingsThisWeek: number;
  bookingsThisMonth: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
}
