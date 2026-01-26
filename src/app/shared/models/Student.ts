export interface UpcomingCourse {
  id: number;
  subject: string;
  teacher: string;
  date: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface PastCourse {
  id: number;
  subject: string;
  teacher: string;
  date: Date;
  duration: number;
  status: 'completed' | 'missed';
}

export interface Teacher {
  id: number;
  name: string;
  subject: string;
  email: string;
}

export interface Grade {
  id: number;
  subject: string;
  value: number;
  date: Date;
}