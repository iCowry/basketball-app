
import React, { useState, useEffect } from 'react';
import { Layout, Dumbbell, BookOpen, Trophy, PlayCircle, Menu, X, BrainCircuit, Globe, ChevronDown, ChevronRight, Check, Save, Trash2, Plus, Users, ArrowLeft, ClipboardList, Calendar, Play, Circle, Flag, School, GraduationCap, UserPlus, ClipboardCheck, Medal, Timer, Award, BarChart3, Shuffle, Loader2 } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import TacticsBoard from './components/TacticsBoard';
import { ViewState, SkillCategory, TacticMode, Language, SavedPlan, SkillItem, ManagedLeague, ManagedTeam, ManagedPlayer, ManagedMatch, MatchPlayerStats, School as SchoolType, SchoolClass, Student, SchoolGrade, DadsCupRegistration } from './types';
import { TRANSLATIONS, TACTIC_CATEGORIES, SKILL_LIBRARY } from './constants';
import { generatePlan, analyzeTactic, generateScoutingReport } from './services/gemini';
import ReactMarkdown from 'react-markdown';

const App = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  // Translations shortcut
  const t = TRANSLATIONS[language];

  // Specific state for views
  const [activeSkillCategory, setActiveSkillCategory] = useState<SkillCategory>(SkillCategory.TECHNICAL);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  // State for collapsible skill sub-categories
  const [expandedSubCategories, setExpandedSubCategories] = useState<Record<string, boolean>>({});
  
  const [activeTacticMode, setActiveTacticMode] = useState<TacticMode>('5v5');
  
  // Tactics Selection State
  const [activeCategoryId, setActiveCategoryId] = useState<string>(TACTIC_CATEGORIES[0].id);
  const [selectedTacticId, setSelectedTacticId] = useState<string>('');
  const [selectedTacticName, setSelectedTacticName] = useState<string>('');
  const [tacticAnalysis, setTacticAnalysis] = useState<string>('');
  
  // League Management State
  const [leagues, setLeagues] = useState<ManagedLeague[]>([]);
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null); // For scout report modal
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null); // For live tracker
  const [activeLeagueTab, setActiveLeagueTab] = useState<'teams' | 'matches'>('teams');
  const [scoutingReport, setScoutingReport] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // School Management State
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
  const [activeGradeId, setActiveGradeId] = useState<string | null>(null);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeSchoolTab, setActiveSchoolTab] = useState<'management' | 'dadscup'>('management');
  
  // Dad's Cup State
  const [dadsCupRegistrations, setDadsCupRegistrations] = useState<DadsCupRegistration[]>([]);
  const [isDadsCupModalOpen, setIsDadsCupModalOpen] = useState(false);
  const [dadsLeagueMode, setDadsLeagueMode] = useState<'intra' | 'inter'>('intra'); // 'intra' = Class vs Class, 'inter' = School vs School

  // Cascading Dropdown State for Form
  const [formSchoolId, setFormSchoolId] = useState('');
  const [formGradeId, setFormGradeId] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formDadInfo, setFormDadInfo] = useState({ 
    name: '', 
    phone: '', 
    jersey: '', 
    height: '', 
    position: 'Forward', 
    specialty: '' 
  });

  
  // Form states
  const [isAddLeagueOpen, setIsAddLeagueOpen] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  
  // School Form States
  const [isAddSchoolOpen, setIsAddSchoolOpen] = useState(false);
  const [isAddGradeOpen, setIsAddGradeOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // Form Inputs
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueSeason, setNewLeagueSeason] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCoach, setNewTeamCoach] = useState('');
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '', position: 'G', height: '', weight: '', pts: '0', reb: '0', ast: '0' });
  const [newMatch, setNewMatch] = useState({ homeTeamId: '', awayTeamId: '', date: '' });

  // School Form Inputs
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolRegion, setNewSchoolRegion] = useState('');
  const [newGradeName, setNewGradeName] = useState(''); // e.g., Enrollment Year
  const [newClassName, setNewClassName] = useState('');
  const [newStudent, setNewStudent] = useState({ name: '', age: '', height: '', weight: '', parentName: '', parentPhone: '' });


  // Training state
  const [trainingConfig, setTrainingConfig] = useState({ days: '7', level: 'Intermediate', focus: 'Shooting', age: '18' });
  const [trainingPlan, setTrainingPlan] = useState<string>('');
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'generator' | 'saved'>('generator');

  // Effect to handle default expanded category when switching skill tabs
  useEffect(() => {
    const subCategories = SKILL_LIBRARY[activeSkillCategory];
    if (subCategories && subCategories.length > 0) {
      // Default: Expand only the first sub-category
      setExpandedSubCategories({ [subCategories[0].id]: true });
      setSelectedSkillId(null);
    }
  }, [activeSkillCategory]);

  // Initialize selected tactic when mode or category changes
  useEffect(() => {
    // Filter items based on mode
    const category = TACTIC_CATEGORIES.find(c => c.id === activeCategoryId);
    if (category) {
      const availableItems = category.items.filter(item => item.modes.includes(activeTacticMode));
      if (availableItems.length > 0) {
        // If current selection is invalid for new mode, reset
        const currentValid = availableItems.find(i => i.id === selectedTacticId);
        if (!currentValid) {
          setSelectedTacticId(availableItems[0].id);
          setSelectedTacticName(language === 'en' ? availableItems[0].label.en : availableItems[0].label.zh);
          setTacticAnalysis(''); // Clear analysis for new selection
        }
      } else {
        setSelectedTacticId('');
        setSelectedTacticName('');
      }
    }
  }, [activeTacticMode, activeCategoryId, selectedTacticId, language]); 

  // Load Saved Data & Generate Demo Data
  useEffect(() => {
    const savedPlans = localStorage.getItem('gemini_training_plans');
    if (savedPlans) setSavedPlans(JSON.parse(savedPlans));

    const savedLeagues = localStorage.getItem('gemini_managed_leagues');
    if (savedLeagues) setLeagues(JSON.parse(savedLeagues));

    const savedDads = localStorage.getItem('gemini_dads_cup_registrations');
    if (savedDads) setDadsCupRegistrations(JSON.parse(savedDads));

    const savedSchools = localStorage.getItem('gemini_managed_schools');
    if (savedSchools) {
      // Basic check if data is in new format (has grades array)
      const parsed = JSON.parse(savedSchools);
      if (parsed.length > 0 && !parsed[0].grades && parsed[0].classes) {
         setSchools(parsed);
      } else {
         setSchools(parsed);
      }
    } else {
      // No schools? Generate demo data
      generateDemoSchools();
    }
  }, []);

  // Update selected name when language changes
  useEffect(() => {
    for (const cat of TACTIC_CATEGORIES) {
      const found = cat.items.find(item => item.id === selectedTacticId);
      if (found) {
        setSelectedTacticName(language === 'en' ? found.label.en : found.label.zh);
        break;
      }
    }
  }, [language, selectedTacticId]);

  // --- Auto-Fill Dad Info when Student Selected ---
  useEffect(() => {
    if (formSchoolId && formGradeId && formClassId && formStudentId) {
      const school = schools.find(s => s.id === formSchoolId);
      const grade = school?.grades.find(g => g.id === formGradeId);
      const cls = grade?.classes.find(c => c.id === formClassId);
      const student = cls?.students.find(s => s.id === formStudentId);
      
      if (student) {
        setFormDadInfo(prev => ({
          ...prev,
          name: student.parentName || '',
          phone: student.parentPhone || ''
        }));
      }
    }
  }, [formStudentId, formClassId, formGradeId, formSchoolId, schools]);

  // --- Helper: Generate Demo Schools ---
  const generateDemoSchools = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const isAfterSept = now.getMonth() >= 8; // Sept is month 8 (0-indexed)
    
    // Academic Year Logic: 
    // If Sept 2025+, Grade 1 is 2025 entry.
    // If before Sept 2025 (e.g., May 2025), Grade 1 is 2024 entry.
    const startAcademicYear = isAfterSept ? currentYear : currentYear - 1;

    const demoSchoolsNames = [
      '杭州安吉路实验学校',
      '杭州保俶塔实验学校', 
      '杭州景成实验学校', 
      '杭州江南实验学校'
    ];

    const sampleStudentNames = ["张伟", "李强", "王浩", "赵敏", "刘洋", "陈晨", "杨波", "孙洁", "周杰", "吴刚", "郑凯", "徐峰", "朱丽", "马龙", "胡静"];
    const getRandomName = () => sampleStudentNames[Math.floor(Math.random() * sampleStudentNames.length)];

    const newSchools: SchoolType[] = demoSchoolsNames.map((name, index) => {
      const grades: SchoolGrade[] = [];
      
      // Create Grades 1 to 9
      for (let g = 1; g <= 9; g++) {
        const enrollmentYear = startAcademicYear - (g - 1);
        const classes: SchoolClass[] = [];
        
        // Create 6 Classes per Grade
        for (let c = 1; c <= 6; c++) {
          // Generate 5 random students per class for demo
          const demoStudents: Student[] = [];
          for (let s = 1; s <= 5; s++) {
             const sName = `${getRandomName()}`;
             demoStudents.push({
               id: `demo_s_${index}_${g}_${c}_${s}`,
               name: sName,
               age: `${6 + g}`,
               height: `${120 + (g * 5) + Math.floor(Math.random() * 10)}cm`,
               weight: '40kg',
               parentName: `Daddy of ${sName}`,
               parentPhone: '13800000000'
             });
          }

          classes.push({
            id: `demo_c_${index}_${g}_${c}`,
            name: `${g}0${c}班`, // e.g. 101班, 906班
            students: demoStudents
          });
        }

        grades.push({
          id: `demo_g_${index}_${g}`,
          name: `${enrollmentYear}级`, // e.g., 2024级
          classes
        });
      }

      return {
        id: `demo_s_${index}`,
        name: name,
        region: '杭州',
        grades
      };
    });

    setSchools(newSchools);
    localStorage.setItem('gemini_managed_schools', JSON.stringify(newSchools));
  };


  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  const toggleSubCategory = (id: string) => {
    setExpandedSubCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const saveLeagues = (updatedLeagues: ManagedLeague[]) => {
    setLeagues(updatedLeagues);
    localStorage.setItem('gemini_managed_leagues', JSON.stringify(updatedLeagues));
  };

  const saveSchools = (updatedSchools: SchoolType[]) => {
    setSchools(updatedSchools);
    localStorage.setItem('gemini_managed_schools', JSON.stringify(updatedSchools));
  };

  // --- Helper: Calculate Grade Level ---
  const calculateGradeLevel = (entryName: string, lang: Language): string => {
    // Extract first 4 digits
    const match = entryName.match(/\d{4}/);
    if (!match) return '';

    const entryYear = parseInt(match[0], 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // If it's Sept or later, we are in the academic year starting 'currentYear'.
    // If before Sept, we are in the academic year starting 'currentYear - 1'.
    // Grade 1 starts in Sept of entryYear.
    let academicYearStart = currentYear;
    if (currentMonth < 9) {
      academicYearStart = currentYear - 1;
    }

    const yearsDiff = academicYearStart - entryYear;
    // Grade = yearsDiff + 1 (0 diff = 1st Grade)
    const gradeLevel = yearsDiff + 1;

    if (gradeLevel < 1) return lang === 'zh' ? '学前' : 'Pre-K';
    if (gradeLevel > 9 && lang === 'zh') return '已毕业'; 
    if (gradeLevel > 12) return lang === 'zh' ? '已毕业' : 'Graduated';

    return lang === 'zh' ? `${gradeLevel}年级` : `Grade ${gradeLevel}`;
  };

  // --- Dad's Cup Functions ---
  
  // NEW: Generate Demo Data for Dad's Cup
  const generateDadsCupDemoData = () => {
    if (schools.length === 0) {
      alert(language === 'en' ? "Please create a school first." : "请先创建一个学校。");
      return;
    }

    const demoDadsBase = [
      { name: language === 'en' ? "Mike Chen" : "陈建国", phone: "13800138000", h: "178cm", pos: "G", spec: language === 'en' ? "3pt Shooter" : "三分射手" },
      { name: language === 'en' ? "Big John" : "王志强", phone: "13900139000", h: "185cm", pos: "F", spec: language === 'en' ? "Rebounder" : "篮板痴汉" },
      { name: language === 'en' ? "Coach Li" : "李伟", phone: "13700137000", h: "180cm", pos: "G", spec: language === 'en' ? "Floor General" : "全场指挥" },
      { name: language === 'en' ? "Tank Zhang" : "张军", phone: "13600136000", h: "192cm", pos: "C", spec: language === 'en' ? "Paint Beast" : "内线巨兽" },
      { name: language === 'en' ? "Speedy Liu" : "刘勇", phone: "13500135000", h: "175cm", pos: "G", spec: language === 'en' ? "Fast Break" : "快攻反击" },
      { name: language === 'en' ? "Sniper Yang" : "杨光", phone: "13400134000", h: "182cm", pos: "F", spec: language === 'en' ? "Mid-Range" : "中投靓仔" },
      { name: language === 'en' ? "Iron Zhao" : "赵刚", phone: "13300133000", h: "188cm", pos: "F", spec: language === 'en' ? "Defense" : "防守大闸" },
      { name: language === 'en' ? "Flash Sun" : "孙亮", phone: "13200132000", h: "176cm", pos: "G", spec: language === 'en' ? "Steals" : "抢断王" }
    ];

    // Collect available student slots across ALL schools to enable Inter-school demo
    const allSlots: {school: SchoolType, grade: SchoolGrade, cls: SchoolClass, student: Student}[] = [];
    
    schools.forEach(s => {
      s.grades.forEach(g => {
        g.classes.forEach(c => {
          c.students.forEach(st => {
            allSlots.push({ school: s, grade: g, cls: c, student: st });
          });
        });
      });
    });

    if (allSlots.length === 0) {
       alert("No students found in any school to link dads to.");
       return;
    }

    // Generate 12 random dads distributed across schools
    const newRegistrations: DadsCupRegistration[] = [];
    for (let i = 0; i < 12; i++) {
        const slot = allSlots[Math.floor(Math.random() * allSlots.length)];
        const dadTemplate = demoDadsBase[i % demoDadsBase.length];
        
        newRegistrations.push({
          id: `demo_dad_${Date.now()}_${i}`,
          schoolName: slot.school.name,
          gradeName: calculateGradeLevel(slot.grade.name, language), 
          className: slot.cls.name,
          studentName: slot.student.name,
          dadName: `${dadTemplate.name} (${i})`, // Unique names
          dadPhone: dadTemplate.phone,
          dadHeight: dadTemplate.h,
          dadPosition: dadTemplate.pos,
          dadSpecialty: dadTemplate.spec,
          jerseyNumber: `${10 + i}`,
          timestamp: new Date().toLocaleDateString()
        });
    }

    const updated = [...dadsCupRegistrations, ...newRegistrations];
    setDadsCupRegistrations(updated);
    localStorage.setItem('gemini_dads_cup_registrations', JSON.stringify(updated));
  };

  const registerDad = () => {
    if (!formSchoolId || !formGradeId || !formClassId || !formStudentId || !formDadInfo.name) return;

    const school = schools.find(s => s.id === formSchoolId);
    const grade = school?.grades.find(g => g.id === formGradeId);
    const cls = grade?.classes.find(c => c.id === formClassId);
    const student = cls?.students.find(s => s.id === formStudentId);

    const newRegistration: DadsCupRegistration = {
      id: Date.now().toString(),
      schoolName: school?.name || 'Unknown',
      gradeName: calculateGradeLevel(grade?.name || '', language),
      className: cls?.name || 'Unknown',
      studentName: student?.name || 'Unknown',
      dadName: formDadInfo.name,
      dadPhone: formDadInfo.phone,
      dadHeight: formDadInfo.height,
      dadPosition: formDadInfo.position,
      dadSpecialty: formDadInfo.specialty,
      jerseyNumber: formDadInfo.jersey,
      timestamp: new Date().toLocaleDateString()
    };

    const updated = [newRegistration, ...dadsCupRegistrations];
    setDadsCupRegistrations(updated);
    localStorage.setItem('gemini_dads_cup_registrations', JSON.stringify(updated));
    
    // Reset Form
    setIsDadsCupModalOpen(false);
    setFormDadInfo({ name: '', phone: '', jersey: '', height: '', position: 'Forward', specialty: '' });
    setFormStudentId('');
  };

  const deleteRegistration = (id: string) => {
    const updated = dadsCupRegistrations.filter(r => r.id !== id);
    setDadsCupRegistrations(updated);
    localStorage.setItem('gemini_dads_cup_registrations', JSON.stringify(updated));
  };

  // NEW: Generate League from Registrations
  const generateDadsLeague = () => {
    if (dadsCupRegistrations.length === 0) return;

    const teamsMap = new Map<string, { name: string, players: ManagedPlayer[] }>();

    dadsCupRegistrations.forEach(reg => {
      // MODE: INTRA (Class vs Class)
      if (dadsLeagueMode === 'intra') {
        const teamKey = `${reg.schoolName}-${reg.gradeName}-${reg.className}`;
        if (!teamsMap.has(teamKey)) {
          teamsMap.set(teamKey, {
            name: `${reg.schoolName} ${reg.className} Dad Team`, 
            players: []
          });
        }
        teamsMap.get(teamKey)!.players.push(createManagedPlayerFromReg(reg));
      } 
      // MODE: INTER (School vs School)
      else {
        const teamKey = `${reg.schoolName}`; // Group by school only
        if (!teamsMap.has(teamKey)) {
          teamsMap.set(teamKey, {
            name: `${reg.schoolName} Representative Team`, 
            players: []
          });
        }
        teamsMap.get(teamKey)!.players.push(createManagedPlayerFromReg(reg));
      }
    });

    // 2. Convert map to array of ManagedTeams
    const newTeams: ManagedTeam[] = Array.from(teamsMap.values()).map((t, index) => ({
      id: `dads_team_${Date.now()}_${index}`,
      name: t.name,
      coach: 'Dad Coach',
      color: index % 2 === 0 ? '#ea580c' : '#3b82f6', // Orange vs Blue defaults
      players: t.players,
      wins: 0,
      losses: 0
    }));

    if (newTeams.length < 2) {
       alert(language === 'zh' ? "队伍数量不足，无法生成联赛。需要至少2支队伍。" : "Not enough teams to generate a league. Need at least 2.");
       return;
    }

    // 3. Create the ManagedLeague object
    const newLeague: ManagedLeague = {
      id: `dads_league_${Date.now()}`,
      name: `Dad's Cup ${new Date().getFullYear()} (${dadsLeagueMode === 'intra' ? (language === 'zh' ? '校内赛' : 'Intra-School') : (language === 'zh' ? '校际赛' : 'Inter-School')})`,
      season: `${new Date().getFullYear()}`,
      type: '5v5',
      teams: newTeams,
      matches: []
    };

    // 4. Save to state and local storage
    const updatedLeagues = [...leagues, newLeague];
    saveLeagues(updatedLeagues);

    // 5. Navigate to League View
    setCurrentView(ViewState.LEAGUE);
    setActiveLeagueId(newLeague.id);
    setActiveLeagueTab('teams');
  };

  const createManagedPlayerFromReg = (reg: DadsCupRegistration): ManagedPlayer => {
    return {
        id: `dad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: reg.dadName,
        number: reg.jerseyNumber || '00',
        position: reg.dadPosition || 'F',
        height: reg.dadHeight || '-',
        weight: '-', 
        stats: { pts: 0, reb: 0, ast: 0 },
        scoutingReport: reg.dadSpecialty ? `**Specialty**: ${reg.dadSpecialty}` : ''
      };
  };


  // --- League Management Functions ---
  const addLeague = () => {
    if (!newLeagueName) return;
    const newLeague: ManagedLeague = {
      id: Date.now().toString(),
      name: newLeagueName,
      season: newLeagueSeason || '2024',
      type: '5v5',
      teams: [],
      matches: []
    };
    saveLeagues([...leagues, newLeague]);
    setNewLeagueName('');
    setNewLeagueSeason('');
    setIsAddLeagueOpen(false);
  };

  const deleteLeague = (id: string) => {
    saveLeagues(leagues.filter(l => l.id !== id));
    if (activeLeagueId === id) setActiveLeagueId(null);
  };

  const addTeam = () => {
    if (!newTeamName || !activeLeagueId) return;
    const newTeam: ManagedTeam = {
      id: Date.now().toString(),
      name: newTeamName,
      coach: newTeamCoach,
      color: '#ea580c',
      wins: 0,
      losses: 0,
      players: []
    };
    const updatedLeagues = leagues.map(l => {
      if (l.id === activeLeagueId) {
        return { ...l, teams: [...l.teams, newTeam] };
      }
      return l;
    });
    saveLeagues(updatedLeagues);
    setNewTeamName('');
    setNewTeamCoach('');
    setIsAddTeamOpen(false);
  };

  const deleteTeam = (leagueId: string, teamId: string) => {
     const updatedLeagues = leagues.map(l => {
      if (l.id === leagueId) {
        return { ...l, teams: l.teams.filter(t => t.id !== teamId) };
      }
      return l;
    });
    saveLeagues(updatedLeagues);
    if (activeTeamId === teamId) setActiveTeamId(null);
  };

  const addPlayer = () => {
    if (!newPlayer.name || !activeLeagueId || !activeTeamId) return;
    const player: ManagedPlayer = {
      id: Date.now().toString(),
      name: newPlayer.name,
      number: newPlayer.number || '0',
      position: newPlayer.position,
      height: newPlayer.height,
      weight: newPlayer.weight,
      stats: {
        pts: parseFloat(newPlayer.pts) || 0,
        reb: parseFloat(newPlayer.reb) || 0,
        ast: parseFloat(newPlayer.ast) || 0,
      }
    };

    const updatedLeagues = leagues.map(l => {
      if (l.id === activeLeagueId) {
        const updatedTeams = l.teams.map(t => {
          if (t.id === activeTeamId) {
            return { ...t, players: [...t.players, player] };
          }
          return t;
        });
        return { ...l, teams: updatedTeams };
      }
      return l;
    });
    saveLeagues(updatedLeagues);
    setNewPlayer({ name: '', number: '', position: 'G', height: '', weight: '', pts: '0', reb: '0', ast: '0' });
    setIsAddPlayerOpen(false);
  };

  const deletePlayer = (leagueId: string, teamId: string, playerId: string) => {
     const updatedLeagues = leagues.map(l => {
      if (l.id === leagueId) {
        const updatedTeams = l.teams.map(t => {
          if (t.id === teamId) {
            return { ...t, players: t.players.filter(p => p.id !== playerId) };
          }
          return t;
        });
        return { ...l, teams: updatedTeams };
      }
      return l;
    });
    saveLeagues(updatedLeagues);
  };

  const addMatch = () => {
    if (!newMatch.homeTeamId || !newMatch.awayTeamId || !activeLeagueId) return;
    const match: ManagedMatch = {
      id: Date.now().toString(),
      homeTeamId: newMatch.homeTeamId,
      awayTeamId: newMatch.awayTeamId,
      date: newMatch.date || new Date().toLocaleDateString(),
      status: 'Scheduled',
      homeScore: 0,
      awayScore: 0,
      stats: {}
    };

    const updatedLeagues = leagues.map(l => {
      if (l.id === activeLeagueId) {
        return { ...l, matches: [...(l.matches || []), match] };
      }
      return l;
    });
    saveLeagues(updatedLeagues);
    setNewMatch({ homeTeamId: '', awayTeamId: '', date: '' });
    setIsAddMatchOpen(false);
  };

  const updateMatchStat = (leagueId: string, matchId: string, playerId: string, statType: 'pts' | 'reb' | 'ast' | 'fouls', value: number) => {
    const updatedLeagues = leagues.map(l => {
      if (l.id === leagueId) {
        const updatedMatches = l.matches.map(m => {
          if (m.id === matchId) {
            const currentStats = m.stats[playerId] || { playerId, pts: 0, reb: 0, ast: 0, fouls: 0 };
            const newStats = { ...currentStats, [statType]: Math.max(0, currentStats[statType] + value) };
            
            // Recalculate score if points changed
            let homeScore = m.homeScore;
            let awayScore = m.awayScore;
            
            if (statType === 'pts') {
              const homeTeam = l.teams.find(t => t.id === m.homeTeamId);
              const isHome = homeTeam?.players.some(p => p.id === playerId);
              if (isHome) homeScore += value;
              else awayScore += value;
            }

            return { 
              ...m, 
              homeScore, 
              awayScore, 
              stats: { ...m.stats, [playerId]: newStats },
              status: 'Live' as const 
            };
          }
          return m;
        });
        return { ...l, matches: updatedMatches };
      }
      return l;
    });
    saveLeagues(updatedLeagues);
  };

  const finishMatch = (leagueId: string, matchId: string) => {
     const updatedLeagues = leagues.map(l => {
      if (l.id === leagueId) {
        const updatedMatches = l.matches.map(m => {
          if (m.id === matchId) return { ...m, status: 'Final' as const };
          return m;
        });
        return { ...l, matches: updatedMatches };
      }
      return l;
    });
    saveLeagues(updatedLeagues);
    setActiveMatchId(null);
  };

  // --- School Management Functions ---
  const addSchool = () => {
    if (!newSchoolName) return;
    const newSchool: SchoolType = {
      id: Date.now().toString(),
      name: newSchoolName,
      region: newSchoolRegion,
      grades: []
    };
    saveSchools([...schools, newSchool]);
    setNewSchoolName('');
    setNewSchoolRegion('');
    setIsAddSchoolOpen(false);
  };

  const deleteSchool = (id: string) => {
    saveSchools(schools.filter(s => s.id !== id));
    if (activeSchoolId === id) {
       setActiveSchoolId(null);
       setActiveGradeId(null);
       setActiveClassId(null);
    }
  };

  const addGrade = () => {
    if (!newGradeName || !activeSchoolId) return;
    const newGrade: SchoolGrade = {
      id: Date.now().toString(),
      name: newGradeName,
      classes: []
    };
    const updatedSchools = schools.map(s => {
      if (s.id === activeSchoolId) {
        return { ...s, grades: [...(s.grades || []), newGrade] };
      }
      return s;
    });
    saveSchools(updatedSchools);
    setNewGradeName('');
    setIsAddGradeOpen(false);
  };

  const deleteGrade = (schoolId: string, gradeId: string) => {
    const updatedSchools = schools.map(s => {
      if (s.id === schoolId) {
        return { ...s, grades: s.grades.filter(g => g.id !== gradeId) };
      }
      return s;
    });
    saveSchools(updatedSchools);
    if (activeGradeId === gradeId) {
      setActiveGradeId(null);
      setActiveClassId(null);
    }
  };

  const addClass = () => {
    if (!newClassName || !activeSchoolId || !activeGradeId) return;
    const newClass: SchoolClass = {
      id: Date.now().toString(),
      name: newClassName,
      students: []
    };
    const updatedSchools = schools.map(s => {
      if (s.id === activeSchoolId) {
        const updatedGrades = s.grades.map(g => {
          if (g.id === activeGradeId) {
            return { ...g, classes: [...g.classes, newClass] };
          }
          return g;
        });
        return { ...s, grades: updatedGrades };
      }
      return s;
    });
    saveSchools(updatedSchools);
    setNewClassName('');
    setIsAddClassOpen(false);
  };

  const deleteClass = (schoolId: string, gradeId: string, classId: string) => {
    const updatedSchools = schools.map(s => {
      if (s.id === schoolId) {
        const updatedGrades = s.grades.map(g => {
          if (g.id === gradeId) {
            return { ...g, classes: g.classes.filter(c => c.id !== classId) };
          }
          return g;
        });
        return { ...s, grades: updatedGrades };
      }
      return s;
    });
    saveSchools(updatedSchools);
    if (activeClassId === classId) setActiveClassId(null);
  };

  const addStudent = () => {
    if (!newStudent.name || !activeSchoolId || !activeGradeId || !activeClassId) return;
    const student: Student = {
      id: Date.now().toString(),
      name: newStudent.name,
      age: newStudent.age,
      height: newStudent.height,
      weight: newStudent.weight,
      parentName: newStudent.parentName,
      parentPhone: newStudent.parentPhone
    };

    const updatedSchools = schools.map(s => {
      if (s.id === activeSchoolId) {
        const updatedGrades = s.grades.map(g => {
          if (g.id === activeGradeId) {
             const updatedClasses = g.classes.map(c => {
               if (c.id === activeClassId) {
                 return { ...c, students: [...c.students, student] };
               }
               return c;
             });
             return { ...g, classes: updatedClasses };
          }
          return g;
        });
        return { ...s, grades: updatedGrades };
      }
      return s;
    });
    saveSchools(updatedSchools);
    setNewStudent({ name: '', age: '', height: '', weight: '', parentName: '', parentPhone: '' });
    setIsAddStudentOpen(false);
  };

  const deleteStudent = (schoolId: string, gradeId: string, classId: string, studentId: string) => {
    const updatedSchools = schools.map(s => {
      if (s.id === schoolId) {
        const updatedGrades = s.grades.map(g => {
           if (g.id === gradeId) {
             const updatedClasses = g.classes.map(c => {
               if (c.id === classId) {
                 return { ...c, students: c.students.filter(st => st.id !== studentId) };
               }
               return c;
             });
             return { ...g, classes: updatedClasses };
           }
           return g;
        });
        return { ...s, grades: updatedGrades };
      }
      return s;
    });
    saveSchools(updatedSchools);
  };


  const handleGenerateScout = async (player: ManagedPlayer) => {
    setActivePlayerId(player.id);
    setIsGeneratingReport(true);
    setScoutingReport('');
    try {
      const report = await generateScoutingReport(player, language);
      setScoutingReport(report);
    } catch (e) {
      setScoutingReport('Failed to generate report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleSavePlan = () => {
    if (!trainingPlan) return;
    const newPlan: SavedPlan = {
      id: Date.now().toString(),
      title: `${trainingConfig.days} Day - ${trainingConfig.focus} (${trainingConfig.level})`,
      date: new Date().toLocaleDateString(),
      content: trainingPlan
    };
    const updated = [newPlan, ...savedPlans];
    setSavedPlans(updated);
    localStorage.setItem('gemini_training_plans', JSON.stringify(updated));
    setActiveTab('saved');
  };

  const handleDeletePlan = (id: string) => {
    const updated = savedPlans.filter(p => p.id !== id);
    setSavedPlans(updated);
    localStorage.setItem('gemini_training_plans', JSON.stringify(updated));
  };

  const handleTacticSelect = (id: string, name: string) => {
    setSelectedTacticId(id);
    setSelectedTacticName(name);
    setTacticAnalysis(t.tactics.analyzing);
    analyzeTactic(name, activeTacticMode, language).then(setTacticAnalysis);
  };

  const handleGeneratePlan = async () => {
    setIsPlanLoading(true);
    try {
      const plan = await generatePlan(trainingConfig, language);
      setTrainingPlan(plan);
    } catch (e) {
      console.error(e);
      setTrainingPlan('Error generating plan.');
    } finally {
      setIsPlanLoading(false);
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
        // Reset navigation states when switching top-level views
        setActiveLeagueId(null); 
        setActiveSchoolId(null);
        setActiveGradeId(null);
        setActiveClassId(null);
      }}
      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all ${
        currentView === view 
          ? 'bg-court-orange text-white shadow-lg shadow-orange-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const renderHome = () => (
    <div className="flex flex-col h-full gap-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {t.home.welcome} <span className="text-court-orange">Gemini Courtside</span>
          </h1>
          <p className="text-slate-300 max-w-xl text-lg">
            {t.home.subtitle}
          </p>
          <button 
            onClick={() => setCurrentView(ViewState.TRAINING)}
            className="mt-6 bg-court-orange text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg"
          >
            {t.home.startTraining}
          </button>
        </div>
        <Trophy className="absolute -bottom-8 -right-8 text-slate-700/30 rotate-12" size={200} />
      </div>

      <div className="flex-1 min-h-[400px]">
        <ChatInterface language={language} />
      </div>
    </div>
  );

  const renderSkills = () => {
    // Flatten subcategories for display or keep them nested
    const subCategories = SKILL_LIBRARY[activeSkillCategory];
    
    // Find selected skill object
    let activeSkill: SkillItem | undefined;
    if (selectedSkillId) {
      for (const sub of subCategories) {
        const found = sub.skills.find(s => s.id === selectedSkillId);
        if (found) activeSkill = found;
      }
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
        {/* Left Sidebar: Navigation */}
        <div className="lg:col-span-3 bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-full overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-700 bg-slate-800">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Dumbbell className="text-court-orange" /> {t.skills.title}
            </h2>
          </div>
          
          <div className="p-3 bg-slate-900 border-b border-slate-800">
             <div className="flex p-1 gap-1 bg-slate-800 rounded-lg">
               <button 
                  onClick={() => { setActiveSkillCategory(SkillCategory.TECHNICAL); }}
                  className={`flex-1 py-2 rounded-md font-bold text-xs sm:text-sm transition-all duration-200 
                    ${activeSkillCategory === SkillCategory.TECHNICAL 
                      ? 'bg-court-orange text-white shadow' 
                      : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {t.skills.technical}
                </button>
                <button 
                  onClick={() => { setActiveSkillCategory(SkillCategory.PHYSICAL); }}
                  className={`flex-1 py-2 rounded-md font-bold text-xs sm:text-sm transition-all duration-200
                    ${activeSkillCategory === SkillCategory.PHYSICAL 
                      ? 'bg-court-orange text-white shadow' 
                      : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {t.skills.physical}
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
             {subCategories.map(sub => {
               const isExpanded = !!expandedSubCategories[sub.id];
               return (
                 <div key={sub.id} className="rounded-lg overflow-hidden">
                   {/* Level 2: Sub-Category Header */}
                   <button 
                      onClick={() => toggleSubCategory(sub.id)}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-lg mb-1 transition-all duration-200 border border-transparent
                        ${isExpanded 
                          ? 'bg-slate-700 text-court-orange font-bold border-slate-600' 
                          : 'bg-slate-800/50 text-slate-300 font-semibold hover:bg-slate-700 hover:text-white'
                        }`}
                   >
                      <span className="uppercase tracking-wider text-xs">{language === 'en' ? sub.label.en : sub.label.zh}</span>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                   </button>
                   
                   {/* Level 3: Skills List */}
                   <div 
                     className={`space-y-1 pl-2 border-l-2 border-slate-700 ml-3 transition-all duration-300 ease-in-out overflow-hidden
                     ${isExpanded ? 'max-h-[500px] opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}`}
                   >
                       {sub.skills.map(skill => (
                         <button
                          key={skill.id}
                          onClick={() => setSelectedSkillId(skill.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-center justify-between
                            ${selectedSkillId === skill.id 
                              ? 'bg-slate-700 text-white font-medium shadow-sm' 
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                         >
                           <span className="truncate">{language === 'en' ? skill.label.en : skill.label.zh}</span>
                           {selectedSkillId === skill.id && <div className="w-1.5 h-1.5 rounded-full bg-court-orange shrink-0"></div>}
                         </button>
                       ))}
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Center/Right: Content & Chat */}
        <div className="lg:col-span-9 flex flex-col h-full gap-4 overflow-hidden">
          {activeSkill ? (
            <div className="flex-1 overflow-y-auto bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-court-orange bg-orange-900/20 px-2 py-1 rounded border border-orange-900/50">
                      {subCategories.find(sub => sub.skills.some(s => s.id === activeSkill?.id))?.label[language]}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">{language === 'en' ? activeSkill.label.en : activeSkill.label.zh}</h2>
                  <p className="text-slate-300 text-lg leading-relaxed">{language === 'en' ? activeSkill.description.en : activeSkill.description.zh}</p>
                </div>

                {/* Video Placeholder */}
                <div className="w-full aspect-video bg-slate-900 rounded-xl flex flex-col items-center justify-center border border-slate-700 mb-8 group cursor-pointer hover:border-court-orange transition-colors shadow-inner">
                   <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-court-orange transition-colors shadow-lg">
                     <PlayCircle size={32} className="text-white ml-1" />
                   </div>
                   <p className="mt-4 text-slate-500 font-medium group-hover:text-white transition-colors">{t.skills.tabs.guide}</p>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                     <h3 className="text-court-accent font-bold mb-4 flex items-center gap-2">
                       <Check size={18} /> {t.skills.tabs.steps}
                     </h3>
                     <ul className="space-y-3">
                       {(language === 'en' ? activeSkill.steps.en : activeSkill.steps.zh).map((step, i) => (
                         <li key={i} className="flex gap-3 text-slate-300 text-sm">
                           <span className="bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-slate-400 border border-slate-700">{i+1}</span>
                           <span className="py-0.5">{step}</span>
                         </li>
                       ))}
                     </ul>
                  </div>

                  <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                     <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                       <X size={18} /> {t.skills.tabs.mistakes}
                     </h3>
                     <ul className="space-y-3">
                       {(language === 'en' ? activeSkill.mistakes.en : activeSkill.mistakes.zh).map((mistake, i) => (
                         <li key={i} className="flex gap-3 text-slate-300 text-sm">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 shrink-0"></span>
                            <span className="py-0.5">{mistake}</span>
                         </li>
                       ))}
                     </ul>
                  </div>
                </div>

                {/* Contextual Chat */}
                <div className="mt-auto pt-6 border-t border-slate-700">
                   <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <BrainCircuit size={16} />
                      {t.nav.aiCoach}
                   </h3>
                   <div className="h-[300px]">
                      <ChatInterface 
                        language={language}
                        compact={true}
                        context={t.skills.context.replace('{skill}', language === 'en' ? activeSkill.label.en : activeSkill.label.zh)}
                      />
                   </div>
                </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-800 rounded-xl border border-slate-700 text-slate-500 shadow-lg">
               <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                 <Dumbbell size={48} className="opacity-50 text-court-orange" />
               </div>
               <p className="text-lg font-medium">{t.skills.selectPrompt}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTactics = () => {
    const selectedCategory = TACTIC_CATEGORIES.find(c => c.id === activeCategoryId);
    const availableItems = selectedCategory?.items.filter(item => item.modes.includes(activeTacticMode)) || [];

    return (
      <div className="flex flex-col lg:flex-row h-full gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-1/4 flex flex-col gap-4">
           {/* Mode Switcher */}
           <div className="bg-slate-800 p-1 rounded-lg flex border border-slate-700">
             <button 
               onClick={() => setActiveTacticMode('5v5')}
               className={`flex-1 py-2 rounded font-bold text-sm transition-all ${activeTacticMode === '5v5' ? 'bg-court-orange text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
               5v5
             </button>
             <button 
               onClick={() => setActiveTacticMode('3x3')}
               className={`flex-1 py-2 rounded font-bold text-sm transition-all ${activeTacticMode === '3x3' ? 'bg-court-orange text-white shadow' : 'text-slate-400 hover:text-white'}`}
             >
               3x3
             </button>
           </div>

           {/* Category & List */}
           <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <select 
                  value={activeCategoryId}
                  onChange={(e) => setActiveCategoryId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-bold"
                >
                  {TACTIC_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{language === 'en' ? cat.label.en : cat.label.zh}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                 {availableItems.length === 0 ? (
                   <div className="text-center text-slate-500 py-8 text-sm">No tactics for this mode.</div>
                 ) : (
                   availableItems.map(item => (
                     <button
                       key={item.id}
                       onClick={() => handleTacticSelect(item.id, language === 'en' ? item.label.en : item.label.zh)}
                       className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between
                         ${selectedTacticId === item.id 
                           ? 'bg-slate-700 text-white shadow-md border-l-4 border-court-orange' 
                           : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}
                     >
                       {language === 'en' ? item.label.en : item.label.zh}
                       {selectedTacticId === item.id && <PlayCircle size={14} className="text-court-orange" />}
                     </button>
                   ))
                 )}
              </div>
           </div>
        </div>

        {/* Board & Analysis */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 <Layout className="text-court-orange" />
                 {selectedTacticName || t.tactics.title}
               </h2>
               {activeTacticMode === '3x3' && <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded border border-purple-800">3x3 Mode</span>}
             </div>
             
             {/* The Board */}
             <TacticsBoard 
               mode={activeTacticMode} 
               language={language}
               selectedTacticId={selectedTacticId}
             />
          </div>

          {/* Analysis Panel */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex-1">
             <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
               <BrainCircuit size={20} className="text-court-accent" />
               {t.tactics.analysisTitle}
             </h3>
             <div className="prose prose-invert prose-sm max-w-none text-slate-300">
               {tacticAnalysis ? (
                 <ReactMarkdown>{tacticAnalysis}</ReactMarkdown>
               ) : (
                 <div className="text-slate-500 italic flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-pulse"></div>
                   {selectedTacticId ? t.tactics.analyzing : t.tactics.placeholder}
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLeague = () => {
    const activeLeague = leagues.find(l => l.id === activeLeagueId);
    
    // ... (rest of League rendering logic)
    // Scout Report Modal
    if (activePlayerId) {
      const activeTeam = activeLeague?.teams.find(t => t.players.some(p => p.id === activePlayerId));
      const player = activeTeam?.players.find(p => p.id === activePlayerId);
      
      return (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-4">
          <div className="bg-slate-800 w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-600 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex justify-between items-start bg-slate-900">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {player?.name} <span className="text-court-orange text-lg">#{player?.number}</span>
                </h2>
                <p className="text-slate-400">{activeTeam?.name} | {player?.position}</p>
              </div>
              <button onClick={() => setActivePlayerId(null)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {/* Stats Summary */}
               <div className="grid grid-cols-3 gap-4">
                 <div className="bg-slate-700/50 p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-white">{player?.stats.pts}</div>
                    <div className="text-xs uppercase tracking-wider text-slate-400">Total PTS</div>
                 </div>
                 <div className="bg-slate-700/50 p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-white">{player?.stats.reb}</div>
                    <div className="text-xs uppercase tracking-wider text-slate-400">Total REB</div>
                 </div>
                 <div className="bg-slate-700/50 p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-white">{player?.stats.ast}</div>
                    <div className="text-xs uppercase tracking-wider text-slate-400">Total AST</div>
                 </div>
               </div>

               {/* AI Analysis */}
               <div>
                  <h3 className="text-lg font-bold text-court-accent mb-3 flex items-center gap-2">
                    <BrainCircuit size={18} /> {t.league.scoutReport}
                  </h3>
                  {isGeneratingReport ? (
                    <div className="flex items-center gap-2 text-slate-400 animate-pulse">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"></div>
                      Analyzing player data...
                    </div>
                  ) : scoutingReport ? (
                    <div className="prose prose-invert prose-sm max-w-none bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                      <ReactMarkdown>{scoutingReport}</ReactMarkdown>
                    </div>
                  ) : (
                     <button 
                       onClick={() => player && handleGenerateScout(player)}
                       className="text-court-orange underline hover:text-orange-400"
                     >
                       {t.league.generateScout}
                     </button>
                  )}
               </div>
            </div>
          </div>
        </div>
      );
    }
    
    // League List View
    if (!activeLeague) {
       return (
         <div className="flex flex-col h-full">
           <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold text-white">{t.league.title}</h2>
             <button 
               onClick={() => setIsAddLeagueOpen(true)}
               className="bg-court-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
             >
               <Plus size={18} /> {t.league.createLeague}
             </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leagues.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                  <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                  {t.league.noLeagues}
                </div>
              ) : (
                leagues.map(l => (
                  <div key={l.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-court-orange transition-all group relative">
                    <div onClick={() => setActiveLeagueId(l.id)} className="cursor-pointer">
                      <h3 className="text-xl font-bold text-white group-hover:text-court-orange mb-1">{l.name}</h3>
                      <p className="text-slate-400 text-sm mb-4">Season: {l.season}</p>
                      <div className="flex gap-4 text-xs text-slate-500">
                         <span className="flex items-center gap-1"><Flag size={12}/> {l.teams.length} Teams</span>
                         <span className="flex items-center gap-1"><Calendar size={12}/> {l.matches?.length || 0} Matches</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteLeague(l.id); }}
                      className="absolute top-4 right-4 text-slate-600 hover:text-red-500 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
           </div>

           {/* Add League Modal */}
           {isAddLeagueOpen && (
             <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 p-6 rounded-xl w-full max-w-sm border border-slate-700">
                   <h3 className="text-lg font-bold text-white mb-4">{t.league.createLeague}</h3>
                   <input 
                     className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-3"
                     placeholder="League Name"
                     value={newLeagueName}
                     onChange={e => setNewLeagueName(e.target.value)}
                   />
                   <input 
                     className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-6"
                     placeholder="Season (e.g. 2023-24)"
                     value={newLeagueSeason}
                     onChange={e => setNewLeagueSeason(e.target.value)}
                   />
                   <div className="flex justify-end gap-2">
                     <button onClick={() => setIsAddLeagueOpen(false)} className="px-3 py-1 text-slate-400 hover:text-white">Cancel</button>
                     <button onClick={addLeague} className="px-3 py-1 bg-court-orange text-white rounded font-bold">Create</button>
                   </div>
                </div>
             </div>
           )}
         </div>
       );
    }

    // Active League Detail View
    return (
      <div className="flex flex-col h-full gap-6">
        {/* League Header */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
           <div className="flex items-center gap-4">
             <button onClick={() => setActiveLeagueId(null)} className="text-slate-400 hover:text-white"><ArrowLeft /></button>
             <div>
               <h2 className="text-2xl font-bold text-white">{activeLeague.name}</h2>
               <p className="text-sm text-slate-400">{activeLeague.season} Season</p>
             </div>
           </div>
           
           <div className="flex bg-slate-900 rounded-lg p-1">
             <button 
               onClick={() => setActiveLeagueTab('teams')}
               className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${activeLeagueTab === 'teams' ? 'bg-court-orange text-white' : 'text-slate-400 hover:text-white'}`}
             >
               {t.league.tabs.teams}
             </button>
             <button 
               onClick={() => setActiveLeagueTab('matches')}
               className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${activeLeagueTab === 'matches' ? 'bg-court-orange text-white' : 'text-slate-400 hover:text-white'}`}
             >
               {t.league.tabs.matches}
             </button>
           </div>
        </div>

        {/* Content Tabs */}
        <div className="flex-1 overflow-y-auto">
           {activeLeagueTab === 'teams' && (
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-300">Teams & Players</h3>
                 <button onClick={() => setIsAddTeamOpen(true)} className="text-court-orange hover:text-white text-sm font-bold flex items-center gap-1">
                   <Plus size={16} /> {t.league.createTeam}
                 </button>
               </div>
               
               {activeLeague.teams.length === 0 ? (
                 <div className="text-slate-500 italic text-center py-8">{t.league.noTeams}</div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeLeague.teams.map(team => (
                      <div key={team.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="bg-slate-900/50 p-3 border-b border-slate-700 flex justify-between items-center">
                           <div>
                             <h4 className="font-bold text-white text-lg">{team.name}</h4>
                             <div className="text-xs text-slate-400 flex gap-2">
                               <span>W: {team.wins}</span>
                               <span>L: {team.losses}</span>
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                             <button onClick={() => { setActiveTeamId(team.id); setIsAddPlayerOpen(true); }} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600">
                               + Player
                             </button>
                             <button onClick={() => deleteTeam(activeLeague.id, team.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={14} /></button>
                           </div>
                        </div>
                        <div className="p-0">
                           {team.players.length === 0 ? (
                             <div className="p-4 text-xs text-slate-500 text-center">{t.league.noPlayers}</div>
                           ) : (
                             <table className="w-full text-left text-xs text-slate-300">
                               <thead className="bg-slate-900/30 text-slate-500">
                                 <tr>
                                   <th className="p-2">#</th>
                                   <th className="p-2">Name</th>
                                   <th className="p-2">Pos</th>
                                   <th className="p-2 text-right">Season Stats</th>
                                   <th className="p-2 text-right"></th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-700/50">
                                 {team.players.map(p => (
                                   <tr key={p.id} className="hover:bg-slate-700/30">
                                     <td className="p-2 font-mono text-court-orange">{p.number}</td>
                                     <td className="p-2 font-medium text-white">{p.name}</td>
                                     <td className="p-2 text-slate-400">{p.position}</td>
                                     <td className="p-2 text-right text-slate-400 font-mono">
                                       {p.stats.pts}p / {p.stats.reb}r / {p.stats.ast}a
                                     </td>
                                     <td className="p-2 text-right flex justify-end gap-2">
                                       <button onClick={() => handleGenerateScout(p)} className="text-court-accent hover:text-white" title="Scout Report"><BrainCircuit size={14} /></button>
                                       <button onClick={() => deletePlayer(activeLeague.id, team.id, p.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={14} /></button>
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           )}
                        </div>
                      </div>
                    ))}
                 </div>
               )}
             </div>
           )}

           {activeLeagueTab === 'matches' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-300">Schedule</h3>
                 <button onClick={() => setIsAddMatchOpen(true)} className="text-court-orange hover:text-white text-sm font-bold flex items-center gap-1">
                   <Plus size={16} /> {t.league.match.create}
                 </button>
               </div>

               {(activeLeague.matches || []).length === 0 ? (
                 <div className="text-slate-500 italic text-center py-8">{t.league.match.noMatches}</div>
               ) : (
                 <div className="space-y-3">
                   {activeLeague.matches?.map(m => {
                     const home = activeLeague.teams.find(t => t.id === m.homeTeamId);
                     const away = activeLeague.teams.find(t => t.id === m.awayTeamId);
                     return (
                       <div key={m.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-6 flex-1 justify-center md:justify-start">
                             <div className="text-right flex-1">
                               <div className="font-bold text-white text-lg">{home?.name || 'Unknown'}</div>
                             </div>
                             <div className="flex flex-col items-center px-4 bg-slate-900 rounded-lg py-2 min-w-[100px]">
                               <div className="text-2xl font-bold font-mono text-court-orange">{m.homeScore} - {m.awayScore}</div>
                               <div className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${m.status === 'Live' ? 'bg-green-900 text-green-400' : 'text-slate-500'}`}>{m.status}</div>
                             </div>
                             <div className="text-left flex-1">
                               <div className="font-bold text-white text-lg">{away?.name || 'Unknown'}</div>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-3 w-full md:w-auto justify-center">
                             {m.status !== 'Final' ? (
                               <button 
                                 onClick={() => setActiveMatchId(m.id)} 
                                 className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold text-sm flex items-center gap-2 shadow-lg"
                               >
                                 <PlayCircle size={16} /> {m.status === 'Live' ? 'Resume' : 'Start Game'}
                               </button>
                             ) : (
                               <button 
                                onClick={() => setActiveMatchId(m.id)}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded font-bold text-sm flex items-center gap-1 transition-colors border border-slate-600"
                               >
                                <BarChart3 size={14}/> View Stats
                               </button>
                             )}
                          </div>
                       </div>
                     );
                   })}
                 </div>
               )}
             </div>
           )}
        </div>

        {/* Modals for Add Team/Player/Match (Simplified) */}
        {isAddTeamOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
             <div className="bg-slate-800 p-6 rounded-xl w-full max-w-sm border border-slate-700">
                <h3 className="text-white font-bold mb-4">{t.league.createTeam}</h3>
                <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-2" placeholder="Team Name" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-4" placeholder="Coach Name" value={newTeamCoach} onChange={e => setNewTeamCoach(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAddTeamOpen(false)} className="px-3 py-1 text-slate-400">Cancel</button>
                  <button onClick={addTeam} className="px-3 py-1 bg-court-orange text-white rounded font-bold">Add</button>
                </div>
             </div>
          </div>
        )}

        {isAddPlayerOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
             <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md border border-slate-700">
                <h3 className="text-white font-bold mb-4">{t.league.createPlayer}</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                   <input className="col-span-2 w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" placeholder="Name" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} />
                   <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" placeholder="Number (#)" value={newPlayer.number} onChange={e => setNewPlayer({...newPlayer, number: e.target.value})} />
                   <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newPlayer.position} onChange={e => setNewPlayer({...newPlayer, position: e.target.value})}>
                     <option value="G">Guard</option>
                     <option value="F">Forward</option>
                     <option value="C">Center</option>
                   </select>
                   <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" placeholder="Height (cm)" value={newPlayer.height} onChange={e => setNewPlayer({...newPlayer, height: e.target.value})} />
                   <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" placeholder="Weight (kg)" value={newPlayer.weight} onChange={e => setNewPlayer({...newPlayer, weight: e.target.value})} />
                   <div className="col-span-2 border-t border-slate-700 pt-2 mt-2">
                      <label className="text-xs text-slate-400 block mb-1">Avg Stats (Optional)</label>
                      <div className="flex gap-2">
                         <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" placeholder="PTS" value={newPlayer.pts} onChange={e => setNewPlayer({...newPlayer, pts: e.target.value})} />
                         <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" placeholder="REB" value={newPlayer.reb} onChange={e => setNewPlayer({...newPlayer, reb: e.target.value})} />
                         <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm" placeholder="AST" value={newPlayer.ast} onChange={e => setNewPlayer({...newPlayer, ast: e.target.value})} />
                      </div>
                   </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAddPlayerOpen(false)} className="px-3 py-1 text-slate-400">Cancel</button>
                  <button onClick={addPlayer} className="px-3 py-1 bg-court-orange text-white rounded font-bold">Add Player</button>
                </div>
             </div>
          </div>
        )}
        
        {isAddMatchOpen && (
           <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 p-6 rounded-xl w-full max-w-sm border border-slate-700">
                <h3 className="text-white font-bold mb-4">{t.league.match.create}</h3>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs text-slate-400">Home Team</label>
                    <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newMatch.homeTeamId} onChange={e => setNewMatch({...newMatch, homeTeamId: e.target.value})}>
                      <option value="">Select Home</option>
                      {activeLeague.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Away Team</label>
                    <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newMatch.awayTeamId} onChange={e => setNewMatch({...newMatch, awayTeamId: e.target.value})}>
                      <option value="">Select Away</option>
                      {activeLeague.teams.filter(t => t.id !== newMatch.homeTeamId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Date</label>
                    <input type="date" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newMatch.date} onChange={e => setNewMatch({...newMatch, date: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAddMatchOpen(false)} className="px-3 py-1 text-slate-400">Cancel</button>
                  <button onClick={addMatch} className="px-3 py-1 bg-court-orange text-white rounded font-bold">Schedule</button>
                </div>
              </div>
           </div>
        )}

      </div>
    );
  };

  const renderSchool = () => {
    // Dad's Cup Tab
    if (activeSchoolTab === 'dadscup') {
      return (
         <div className="flex flex-col h-full gap-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-center shadow-lg bg-gradient-to-r from-slate-800 to-slate-900 gap-4">
               <div>
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Trophy className="text-yellow-500" size={32} />
                    {t.school.dadscup.title}
                  </h2>
                  <p className="text-slate-400 mb-2">Join the ultimate basketball tournament for basketball dads!</p>
                  
                  {/* MODE SWITCHER */}
                  <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-700 w-fit">
                     <button 
                        onClick={() => setDadsLeagueMode('intra')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${dadsLeagueMode === 'intra' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                     >
                       {language === 'zh' ? '班级联赛 (校内)' : 'Intra-School (Class)'}
                     </button>
                     <button 
                        onClick={() => setDadsLeagueMode('inter')}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${dadsLeagueMode === 'inter' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                     >
                       {language === 'zh' ? '校际联赛 (对外)' : 'Inter-School'}
                     </button>
                  </div>
               </div>
               
               <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <button 
                        onClick={generateDadsCupDemoData}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold shadow-lg flex items-center gap-2 border border-slate-600 text-xs"
                    >
                        <UserPlus size={16} /> {t.school.dadscup.generateDemo}
                    </button>
                    <button 
                        onClick={() => setIsDadsCupModalOpen(true)}
                        className="px-4 py-2 bg-court-orange hover:bg-orange-600 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 text-xs"
                    >
                        <ClipboardCheck size={16} /> {t.school.dadscup.register}
                    </button>
                  </div>
                  <button 
                    onClick={generateDadsLeague}
                    disabled={dadsCupRegistrations.length < 2} 
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2"
                  >
                    <Medal size={20} /> 
                    {language === 'zh' ? `生成${dadsLeagueMode === 'intra' ? '班级' : '校际'}联赛` : `Generate ${dadsLeagueMode === 'intra' ? 'Class' : 'School'} League`}
                  </button>
               </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 flex-1 overflow-hidden flex flex-col">
               <div className="p-4 bg-slate-900/50 border-b border-slate-700 font-bold text-slate-300 flex justify-between">
                  <span>{t.school.dadscup.registered} ({dadsCupRegistrations.length})</span>
                  <span className="text-xs font-normal text-indigo-400 border border-indigo-900 bg-indigo-900/20 px-2 py-0.5 rounded">
                     {dadsLeagueMode === 'intra' ? (language === 'zh' ? '当前模式: 班级对抗' : 'Mode: Class vs Class') : (language === 'zh' ? '当前模式: 学校对抗' : 'Mode: School vs School')}
                  </span>
               </div>
               <div className="flex-1 overflow-y-auto p-4">
                  {dadsCupRegistrations.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                       <Users size={48} className="mx-auto mb-4 opacity-20" />
                       <p>{t.school.dadscup.noRegistrations}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {dadsCupRegistrations.map(reg => (
                         <div key={reg.id} className="bg-slate-700/30 p-4 rounded-lg border border-slate-700 flex flex-col gap-2 relative group hover:border-indigo-500/50 transition-colors">
                            <div className="flex justify-between items-start">
                               <div>
                                  <h4 className="font-bold text-white text-lg">{reg.dadName}</h4>
                                  <div className="text-xs text-court-orange font-bold uppercase">{reg.dadPosition} • {reg.dadHeight}</div>
                               </div>
                               <div className="text-2xl font-mono font-bold text-slate-500">#{reg.jerseyNumber}</div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-400 space-y-1">
                               <p className={`flex items-center gap-2 ${dadsLeagueMode === 'inter' ? 'text-white font-bold' : ''}`}><School size={12}/> {reg.schoolName}</p>
                               <p className={`flex items-center gap-2 ${dadsLeagueMode === 'intra' ? 'text-white font-bold' : ''}`}><GraduationCap size={12}/> {reg.gradeName} • {reg.className}</p>
                               <p className="flex items-center gap-2"><Users size={12}/> Child: {reg.studentName}</p>
                               {reg.dadSpecialty && <p className="text-court-accent italic">"{reg.dadSpecialty}"</p>}
                            </div>
                            <button 
                              onClick={() => deleteRegistration(reg.id)}
                              className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>

            {/* Registration Modal */}
            {isDadsCupModalOpen && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                 <div className="bg-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 shadow-2xl">
                    <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900 sticky top-0">
                       <h3 className="text-xl font-bold text-white">{t.school.dadscup.title}</h3>
                       <button onClick={() => setIsDadsCupModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
                    </div>
                    <div className="p-6 space-y-6">
                       {/* Step 1: Link Child */}
                       <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                          <h4 className="text-court-orange font-bold mb-4 uppercase text-xs tracking-wider">Step 1: Link Student</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <select className="bg-slate-800 border border-slate-600 rounded p-2 text-white" value={formSchoolId} onChange={e => { setFormSchoolId(e.target.value); setFormGradeId(''); }}>
                               <option value="">{t.school.dadscup.form.selectSchool}</option>
                               {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                             </select>
                             <select className="bg-slate-800 border border-slate-600 rounded p-2 text-white" value={formGradeId} onChange={e => { setFormGradeId(e.target.value); setFormClassId(''); }} disabled={!formSchoolId}>
                               <option value="">{t.school.dadscup.form.selectGrade}</option>
                               {schools.find(s => s.id === formSchoolId)?.grades.map(g => <option key={g.id} value={g.id}>{calculateGradeLevel(g.name, language)} ({g.name})</option>)}
                             </select>
                             <select className="bg-slate-800 border border-slate-600 rounded p-2 text-white" value={formClassId} onChange={e => { setFormClassId(e.target.value); setFormStudentId(''); }} disabled={!formGradeId}>
                               <option value="">{t.school.dadscup.form.selectClass}</option>
                               {schools.find(s => s.id === formSchoolId)?.grades.find(g => g.id === formGradeId)?.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                             </select>
                             <select className="bg-slate-800 border border-slate-600 rounded p-2 text-white" value={formStudentId} onChange={e => setFormStudentId(e.target.value)} disabled={!formClassId}>
                               <option value="">{t.school.dadscup.form.selectStudent}</option>
                               {schools.find(s => s.id === formSchoolId)?.grades.find(g => g.id === formGradeId)?.classes.find(c => c.id === formClassId)?.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                             </select>
                          </div>
                       </div>

                       {/* Step 2: Dad Info */}
                       <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                          <h4 className="text-court-orange font-bold mb-4 uppercase text-xs tracking-wider">Step 2: Dad's Profile</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <input className="bg-slate-800 border border-slate-600 rounded p-2 text-white" placeholder={t.school.dadscup.form.dadName} value={formDadInfo.name} onChange={e => setFormDadInfo({...formDadInfo, name: e.target.value})} />
                             <input className="bg-slate-800 border border-slate-600 rounded p-2 text-white" placeholder={t.school.dadscup.form.dadPhone} value={formDadInfo.phone} onChange={e => setFormDadInfo({...formDadInfo, phone: e.target.value})} />
                             <div className="flex gap-2">
                               <input className="flex-1 bg-slate-800 border border-slate-600 rounded p-2 text-white" placeholder="Height (cm)" value={formDadInfo.height} onChange={e => setFormDadInfo({...formDadInfo, height: e.target.value})} />
                               <input className="w-24 bg-slate-800 border border-slate-600 rounded p-2 text-white" placeholder="# Jersey" value={formDadInfo.jersey} onChange={e => setFormDadInfo({...formDadInfo, jersey: e.target.value})} />
                             </div>
                             <select className="bg-slate-800 border border-slate-600 rounded p-2 text-white" value={formDadInfo.position} onChange={e => setFormDadInfo({...formDadInfo, position: e.target.value})}>
                               <option value="Guard">Guard (G)</option>
                               <option value="Forward">Forward (F)</option>
                               <option value="Center">Center (C)</option>
                             </select>
                             <input className="col-span-1 md:col-span-2 bg-slate-800 border border-slate-600 rounded p-2 text-white" placeholder="Specialty (e.g. 3pt shooter, lockdown defense)" value={formDadInfo.specialty} onChange={e => setFormDadInfo({...formDadInfo, specialty: e.target.value})} />
                          </div>
                       </div>
                    </div>
                    <div className="p-6 border-t border-slate-700 bg-slate-900 flex justify-end gap-3">
                       <button onClick={() => setIsDadsCupModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                       <button 
                         onClick={registerDad}
                         disabled={!formStudentId || !formDadInfo.name}
                         className="px-6 py-2 bg-court-orange hover:bg-orange-600 disabled:opacity-50 text-white rounded font-bold"
                       >
                         {t.school.dadscup.form.submit}
                       </button>
                    </div>
                 </div>
              </div>
            )}
         </div>
      );
    }

    // Management Tab View
    return (
      <div className="flex flex-col h-full gap-6">
        <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><School size={24} className="text-court-orange"/> {t.school.title}</h2>
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button onClick={() => setActiveSchoolTab('management')} className={`px-4 py-1.5 rounded text-sm font-bold ${activeSchoolTab === 'management' ? 'bg-court-orange text-white' : 'text-slate-400'}`}>{t.school.tabs.management}</button>
              <button onClick={() => setActiveSchoolTab('dadscup')} className={`px-4 py-1.5 rounded text-sm font-bold ${activeSchoolTab === 'dadscup' ? 'bg-court-orange text-white' : 'text-slate-400'}`}>{t.school.tabs.dadscup}</button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
           {/* Column 1: Schools */}
           <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
              <div className="p-3 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                 <span className="font-bold text-slate-300">Schools</span>
                 <button onClick={() => setIsAddSchoolOpen(true)}><Plus size={16} className="text-court-orange"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                 {schools.map(s => (
                   <div 
                      key={s.id} 
                      onClick={() => { setActiveSchoolId(s.id); setActiveGradeId(null); setActiveClassId(null); }}
                      className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group ${activeSchoolId === s.id ? 'bg-court-orange text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                   >
                      <div>
                        <div className="font-bold">{s.name}</div>
                        <div className="text-xs opacity-70">{s.region}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteSchool(s.id); }} className="opacity-0 group-hover:opacity-100 hover:text-red-300"><Trash2 size={14} /></button>
                   </div>
                 ))}
              </div>
           </div>

           {/* Column 2: Grades */}
           <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
               <div className="p-3 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                 <span className="font-bold text-slate-300">Grades / Years</span>
                 <button onClick={() => setIsAddGradeOpen(true)} disabled={!activeSchoolId} className="disabled:opacity-20"><Plus size={16} className="text-court-orange"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                 {!activeSchoolId ? <div className="text-xs text-slate-500 text-center p-4">Select School</div> : 
                   schools.find(s => s.id === activeSchoolId)?.grades.map(g => (
                    <div 
                      key={g.id} 
                      onClick={() => { setActiveGradeId(g.id); setActiveClassId(null); }}
                      className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group ${activeGradeId === g.id ? 'bg-slate-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                   >
                      <div>
                        <div className="font-bold">{calculateGradeLevel(g.name, language)}</div>
                        <div className="text-xs opacity-70">Entry: {g.name}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteGrade(activeSchoolId, g.id); }} className="opacity-0 group-hover:opacity-100 hover:text-red-300"><Trash2 size={14} /></button>
                   </div>
                 ))}
              </div>
           </div>

           {/* Column 3: Classes */}
           <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
               <div className="p-3 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                 <span className="font-bold text-slate-300">Classes</span>
                 <button onClick={() => setIsAddClassOpen(true)} disabled={!activeGradeId} className="disabled:opacity-20"><Plus size={16} className="text-court-orange"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                 {!activeGradeId ? <div className="text-xs text-slate-500 text-center p-4">Select Grade</div> : 
                   schools.find(s => s.id === activeSchoolId)?.grades.find(g => g.id === activeGradeId)?.classes.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setActiveClassId(c.id)}
                      className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group ${activeClassId === c.id ? 'bg-slate-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
                   >
                      <div className="font-bold">{c.name}</div>
                      <button onClick={(e) => { e.stopPropagation(); deleteClass(activeSchoolId!, activeGradeId!, c.id); }} className="opacity-0 group-hover:opacity-100 hover:text-red-300"><Trash2 size={14} /></button>
                   </div>
                 ))}
              </div>
           </div>

           {/* Column 4: Students */}
           <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden">
               <div className="p-3 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                 <span className="font-bold text-slate-300">Students</span>
                 <button onClick={() => setIsAddStudentOpen(true)} disabled={!activeClassId} className="disabled:opacity-20"><Plus size={16} className="text-court-orange"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                 {!activeClassId ? <div className="text-xs text-slate-500 text-center p-4">Select Class</div> : 
                   schools.find(s => s.id === activeSchoolId)?.grades.find(g => g.id === activeGradeId)?.classes.find(c => c.id === activeClassId)?.students.map(st => (
                    <div key={st.id} className="bg-slate-900 border border-slate-700 p-3 rounded-lg group relative">
                       <div className="font-bold text-white text-sm">{st.name}</div>
                       <div className="text-xs text-slate-400 mt-1">
                          {st.age} yrs • {st.height} • {st.weight}
                       </div>
                       <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Users size={10} /> {st.parentName}
                       </div>
                       <button onClick={() => deleteStudent(activeSchoolId!, activeGradeId!, activeClassId!, st.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Modals for School Management */}
        {isAddSchoolOpen && (
           <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 p-6 rounded-xl w-full max-w-sm border border-slate-700">
                 <h3 className="text-white font-bold mb-4">{t.school.createSchool}</h3>
                 <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-2" placeholder="School Name" value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)} />
                 <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-4" placeholder="Region" value={newSchoolRegion} onChange={e => setNewSchoolRegion(e.target.value)} />
                 <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAddSchoolOpen(false)} className="px-3 py-1 text-slate-400">Cancel</button>
                    <button onClick={addSchool} className="px-3 py-1 bg-court-orange text-white rounded font-bold">Add</button>
                 </div>
              </div>
           </div>
        )}

        {isAddGradeOpen && (
           <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 p-6 rounded-xl w-full max-w-sm border border-slate-700">
                 <h3 className="text-white font-bold mb-4">{t.school.createGrade}</h3>
                 <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-4" placeholder="Enrollment Year (e.g. 2022)" value={newGradeName} onChange={e => setNewGradeName(e.target.value)} />
                 <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAddGradeOpen(false)} className="px-3 py-1 text-slate-400">Cancel</button>
                    <button onClick={addGrade} className="px-3 py-1 bg-court-orange text-white rounded font-bold">Add</button>
                 </div>
              </div>
           </div>
        )}

        {isAddClassOpen && (
           <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 p-6 rounded-xl w-full max-w-sm border border-slate-700">
                 <h3 className="text-white font-bold mb-4">{t.school.createClass}</h3>
                 <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-4" placeholder="Class Name (e.g. 101班)" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                 <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAddClassOpen(false)} className="px-3 py-1 text-slate-400">Cancel</button>
                    <button onClick={addClass} className="px-3 py-1 bg-court-orange text-white rounded font-bold">Add</button>
                 </div>
              </div>
           </div>
        )}

        {isAddStudentOpen && (
           <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 p-6 rounded-xl w-full max-w-sm border border-slate-700">
                 <h3 className="text-white font-bold mb-4">{t.school.createStudent}</h3>
                 <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-2" placeholder="Student Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                 <div className="flex gap-2 mb-2">
                    <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" placeholder="Age" value={newStudent.age} onChange={e => setNewStudent({...newStudent, age: e.target.value})} />
                    <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" placeholder="Height" value={newStudent.height} onChange={e => setNewStudent({...newStudent, height: e.target.value})} />
                 </div>
                 <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-2" placeholder="Weight" value={newStudent.weight} onChange={e => setNewStudent({...newStudent, weight: e.target.value})} />
                 <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-2" placeholder="Parent Name" value={newStudent.parentName} onChange={e => setNewStudent({...newStudent, parentName: e.target.value})} />
                 <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-4" placeholder="Parent Phone" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} />
                 <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAddStudentOpen(false)} className="px-3 py-1 text-slate-400">Cancel</button>
                    <button onClick={addStudent} className="px-3 py-1 bg-court-orange text-white rounded font-bold">Add</button>
                 </div>
              </div>
           </div>
        )}
     </div>
  );
  }; // <--- Fixed missing closing brace

  const renderTraining = () => {
    return (
      <div className="flex flex-col h-full gap-6">
         <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
             <h2 className="text-2xl font-bold text-white flex items-center gap-2">
               <ClipboardList className="text-court-orange" /> {t.training.title}
             </h2>
             <div className="flex bg-slate-900 rounded-lg p-1">
               <button onClick={() => setActiveTab('generator')} className={`px-4 py-1.5 rounded text-sm font-bold ${activeTab === 'generator' ? 'bg-court-orange text-white' : 'text-slate-400'}`}>Generator</button>
               <button onClick={() => setActiveTab('saved')} className={`px-4 py-1.5 rounded text-sm font-bold ${activeTab === 'saved' ? 'bg-court-orange text-white' : 'text-slate-400'}`}>{t.training.savedPlans}</button>
             </div>
         </div>

         {activeTab === 'generator' ? (
           <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
             {/* Config Panel */}
             <div className="lg:w-1/3 bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col gap-6 h-fit">
                <div>
                   <label className="text-sm font-bold text-slate-400 mb-2 block">{t.training.duration}</label>
                   <select 
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white"
                     value={trainingConfig.days}
                     onChange={(e) => setTrainingConfig({...trainingConfig, days: e.target.value})}
                   >
                     {Object.entries(t.training.daysOptions).map(([k, v]) => (
                       <option key={k} value={k}>{v}</option>
                     ))}
                   </select>
                </div>
                <div>
                   <label className="text-sm font-bold text-slate-400 mb-2 block">{t.training.level}</label>
                   <select 
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white"
                     value={trainingConfig.level}
                     onChange={(e) => setTrainingConfig({...trainingConfig, level: e.target.value})}
                   >
                     {Object.entries(t.training.levelOptions).map(([k, v]) => (
                       <option key={k} value={k}>{v}</option>
                     ))}
                   </select>
                </div>
                <div>
                   <label className="text-sm font-bold text-slate-400 mb-2 block">{t.training.focus}</label>
                   <input 
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white"
                     value={trainingConfig.focus}
                     onChange={(e) => setTrainingConfig({...trainingConfig, focus: e.target.value})}
                     placeholder="e.g. Shooting, Defense, Conditioning"
                   />
                </div>
                <div>
                   <label className="text-sm font-bold text-slate-400 mb-2 block">{t.training.age}</label>
                   <input 
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white"
                     type="number"
                     value={trainingConfig.age}
                     onChange={(e) => setTrainingConfig({...trainingConfig, age: e.target.value})}
                   />
                </div>
                
                <button 
                  onClick={handleGeneratePlan}
                  disabled={isPlanLoading}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  {isPlanLoading ? (
                    <>
                      <Loader2 className="animate-spin" /> {t.training.generatingButton}
                    </>
                  ) : (
                    <>
                      <BrainCircuit /> {t.training.generateButton}
                    </>
                  )}
                </button>
             </div>

             {/* Result Panel */}
             <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col overflow-hidden shadow-lg relative">
                {trainingPlan ? (
                  <>
                    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
                      <h3 className="text-xl font-bold text-white">AI Generated Plan</h3>
                      <button onClick={handleSavePlan} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                        <Save size={16} /> {t.training.saveButton}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{trainingPlan}</ReactMarkdown>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50">
                    <ClipboardList size={64} className="mb-4" />
                    <p className="text-lg text-center max-w-sm">{t.training.emptyState}</p>
                  </div>
                )}
             </div>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
              {savedPlans.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500">
                   {t.training.noSaved}
                </div>
              ) : (
                savedPlans.map(plan => (
                  <div key={plan.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col shadow-lg">
                     <div className="flex justify-between items-start mb-4">
                       <div>
                         <h3 className="font-bold text-white text-lg line-clamp-1">{plan.title}</h3>
                         <div className="text-xs text-slate-500">{plan.date}</div>
                       </div>
                       <button onClick={() => handleDeletePlan(plan.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={16} /></button>
                     </div>
                     <div className="flex-1 bg-slate-900/50 p-3 rounded-lg text-xs text-slate-400 overflow-hidden relative mb-4 h-32">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90 pointer-events-none"></div>
                        <ReactMarkdown>{plan.content}</ReactMarkdown>
                     </div>
                     <button 
                       onClick={() => { setTrainingPlan(plan.content); setActiveTab('generator'); }}
                       className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-bold text-sm"
                     >
                       View / Load
                     </button>
                  </div>
                ))
              )}
           </div>
         )}
      </div>
    );
  };

  // --- Main Layout ---
  return (
    <div className="flex h-screen bg-court-dark text-slate-200 overflow-hidden font-sans">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-court-orange rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Trophy className="text-white" size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Gemini<span className="text-court-orange">Courtside</span></span>
        </div>

        <nav className="p-4 space-y-2">
          <NavItem view={ViewState.HOME} icon={Layout} label="Home" />
          <NavItem view={ViewState.SKILLS} icon={Dumbbell} label={t.nav.skills} />
          <NavItem view={ViewState.TACTICS} icon={BookOpen} label={t.nav.tactics} />
          <NavItem view={ViewState.LEAGUE} icon={Trophy} label={t.nav.league} />
          <NavItem view={ViewState.SCHOOL} icon={School} label={t.nav.school} />
          <NavItem view={ViewState.TRAINING} icon={ClipboardList} label={t.nav.training} />
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
           <button 
             onClick={toggleLanguage}
             className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition-colors"
           >
             <Globe size={16} /> {language === 'en' ? 'Switch to 中文' : 'Switch to English'}
           </button>
           <div className="text-center mt-4 text-xs text-slate-600">
             v2.0 • {t.common.footer}
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-30">
           <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-2">
             <Menu size={24} />
           </button>
           <span className="font-bold text-white">Gemini Courtside</span>
           <div className="w-8"></div> {/* Spacer */}
        </header>

        {/* View Container */}
        <div className="flex-1 overflow-hidden p-4 lg:p-6 bg-slate-900/50">
          {currentView === ViewState.HOME && renderHome()}
          {currentView === ViewState.SKILLS && renderSkills()}
          {currentView === ViewState.TACTICS && renderTactics()}
          {currentView === ViewState.LEAGUE && renderLeague()}
          {currentView === ViewState.SCHOOL && renderSchool()}
          {currentView === ViewState.TRAINING && renderTraining()}
        </div>
      </main>
    </div>
  );
};

export default App;