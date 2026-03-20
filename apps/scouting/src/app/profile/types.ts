//is this what you meant by putting in a types.ts in the folder

export type UserFormCounts = {
  standCount: number;
  pitCount: number;
  total: number;
};

export type UserFormSubmission = {
  id: string;
  type: "stand" | "pit";
  createdAt: Date;
  teamNumber: number | null;
  matchNumber: number | null;
  matchType: string | null;
};
