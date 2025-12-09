

export enum ViewState {
  HOME = 'HOME',
  SKILLS = 'SKILLS',
  TACTICS = 'TACTICS',
  LEAGUE = 'LEAGUE',
  SCHOOL = 'SCHOOL',
  TRAINING = 'TRAINING'
}

export enum SkillCategory {
  PHYSICAL = 'PHYSICAL',
  TECHNICAL = 'TECHNICAL'
}

export type Language = 'en' | 'zh';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  isStreaming?: boolean;
}

export interface SavedPlan {
  id: string;
  title: string; // e.g., "7-Day Intermediate Shooting"
  date: string;
  content: string; // The markdown content
}

export interface TrainingPlan {
  title: string;
  duration: string;
  level: string;
  sessions: TrainingSession[];
}

export interface TrainingSession {
  day: number;
  focus: string;
  exercises: {
    name: string;
    duration: string;
    description: string;
  }[];
}

export interface TacticNode {
  id: number;
  x: number;
  y: number;
  label: string;
  role: string;
  color?: string; // Optional override for team colors
}

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  style: string;
}

export type TacticMode = '3x3' | '5v5';

export interface TacticItem {
  id: string;
  label: { en: string; zh: string };
  modes: TacticMode[]; // Added modes for filtering
}

export interface TacticCategory {
  id: string;
  label: { en: string; zh: string };
  items: TacticItem[];
}

export interface SkillItem {
  id: string;
  label: { en: string; zh: string };
  description: { en: string; zh: string };
  steps: { en: string[]; zh: string[] };
  mistakes: { en: string[]; zh: string[] };
}

export interface SkillSubCategory {
  id: string;
  label: { en: string; zh: string };
  skills: SkillItem[];
}

export interface SkillLibrary {
  [SkillCategory.TECHNICAL]: SkillSubCategory[];
  [SkillCategory.PHYSICAL]: SkillSubCategory[];
}

// --- LEAGUE MANAGEMENT TYPES ---

export interface ManagedPlayer {
  id: string;
  name: string;
  number: string;
  position: string;
  height: string;
  weight: string;
  stats: {
    pts: number;
    ast: number;
    reb: number;
  };
  scoutingReport?: string; // AI generated
}

export interface ManagedTeam {
  id: string;
  name: string;
  coach: string;
  color: string;
  players: ManagedPlayer[];
  wins: number;
  losses: number;
}

export interface MatchPlayerStats {
  playerId: string;
  pts: number;
  reb: number;
  ast: number;
  fouls: number;
}

export interface ManagedMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  status: 'Scheduled' | 'Live' | 'Final';
  homeScore: number;
  awayScore: number;
  stats: Record<string, MatchPlayerStats>; // playerId -> stats
}

export interface ManagedLeague {
  id: string;
  name: string;
  season: string; // e.g., "2023-2024"
  type: '5v5' | '3x3';
  teams: ManagedTeam[];
  matches: ManagedMatch[];
}

// --- SCHOOL MANAGEMENT TYPES ---

export interface Student {
  id: string;
  name: string;
  age: string;
  height: string;
  weight: string;
  parentName: string; // For Dad's Cup
  parentPhone: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g., "Class 1"
  students: Student[];
}

export interface SchoolGrade {
  id: string;
  name: string; // e.g., "2022 Entry" or "Grade 3"
  classes: SchoolClass[];
}

export interface School {
  id: string;
  name: string;
  region: string; // e.g., "Haidian District"
  grades: SchoolGrade[];
}