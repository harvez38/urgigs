export interface ScreeningResult {
  status: 'pending';
  submittedAt: string;
}

export async function submitScreening(workerId: string): Promise<ScreeningResult> {
  // Simulate API call delay
  await new Promise((r) => setTimeout(r, 1500));
  void workerId;
  return {
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
}
