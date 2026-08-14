// types with a begining nomralzied models


export type AllianceColor = "red" | "blue"
export type AlliancePosition = 1 | 2 | 3;



export type AllianceSlot = {

  teamNumber: number;
  alliance: AllianceColor;
  position: AlliancePosition


  // making optional since csv may not know these

  teamName?: string;
  surrogate?: boolean;



}


export type ScheduledMatch = {


  matchNummber: number;
  matchType: "qm";
  redScore?: number;
  blueScore?: number;
  slots: AllianceSlot[];



}


export type EventTarget = | {
  mode: "create-or-update";
  eventCode: string;
  name: string;
  startDate: Date;
  endDate: Date;
} | {
  mode: "existing-only";
  eventCode: string;
}


export type MatchSchedule = {
  event: EventTarget;
  matches: ScheduledMatch[];

}


export type ImportResult = {
  eventId: string;
  matchCount: number;
  teamMatchCount: number;

}
