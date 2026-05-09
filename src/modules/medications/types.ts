export type Medication = {
  id: string;
  name: string;
  dose?: string;
  time: string;
  notificationId?: string;
  createdAt: string;
};

export type NewMedicationInput = {
  name: string;
  dose?: string;
  time: string;
};
