

import React, { useState, useEffect } from 'react';
import { Layout, Dumbbell, BookOpen, Trophy, PlayCircle, Menu, X, BrainCircuit, Globe, ChevronDown, ChevronRight, Check, Save, Trash2, Plus, Users, ArrowLeft, ClipboardList, Calendar, Play, Circle, Flag, School, GraduationCap, UserPlus } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import TacticsBoard from './components/TacticsBoard';
import { ViewState, SkillCategory, TacticMode, Language, SavedPlan, SkillItem, ManagedLeague, ManagedTeam, ManagedPlayer, ManagedMatch, MatchPlayerStats, School as SchoolType, SchoolClass, Student, SchoolGrade } from './types';
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

  // Load Saved Data
  useEffect(() => {
    const savedPlans = localStorage.getItem('gemini_training_plans');
    if (savedPlans) setSavedPlans(JSON.parse(savedPlans));

    const savedLeagues = localStorage.getItem('gemini_managed_leagues');
    if (savedLeagues) setLeagues(JSON.parse(savedLeagues));

    const savedSchools = localStorage.getItem('gemini_managed_schools');
    if (savedSchools) {
      // Basic check if data is in new format (has grades array)
      const parsed = JSON.parse(savedSchools);
      if (parsed.length > 0 && !parsed[0].grades && parsed[0].classes) {
         // Old format detected, reset or handle migration. For this demo, we'll just respect new format
         // or you could wipe it: localStorage.removeItem('gemini_managed_schools'); setSchools([]);
         // Let's assume user starts fresh or manually clear if conflicts occur
         setSchools(parsed);
      } else {
         setSchools(parsed);
      }
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
    if (gradeLevel > 12) return lang === 'zh' ? '已毕业' : 'Graduated';

    return lang === 'zh' ? `${gradeLevel}年级` : `Grade ${gradeLevel}`;
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

  const renderSchool = () => {
    // Level 4: Student Detail / List (Deepest)
    if (activeClassId && activeGradeId && activeSchoolId) {
      const activeSchool = schools.find(s => s.id === activeSchoolId);
      const activeGrade = activeSchool?.grades?.find(g => g.id === activeGradeId);
      const activeClass = activeGrade?.classes.find(c => c.id === activeClassId);

      if (!activeClass) return null;

      return (
        <div className="flex flex-col h-full gap-6">
           <div className="flex items-center justify-between">
            <button onClick={() => setActiveClassId(null)} className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ArrowLeft size={18} /> {t.common.back}
            </button>
            <div className="text-slate-500 text-sm">{activeSchool?.name} / {activeGrade?.name}</div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
               <div>
                 <h2 className="text-2xl font-bold text-white mb-1">{activeClass.name}</h2>
                 <p className="text-slate-400 text-sm">{activeClass.students.length} Students</p>
               </div>
               <button 
                onClick={() => setIsAddStudentOpen(true)}
                className="bg-court-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
               >
                 <UserPlus size={18} /> {t.school.createStudent}
               </button>
             </div>

             {/* Student List */}
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/50 text-slate-500 uppercase font-medium">
                    <tr>
                      <th className="p-3">{t.school.studentName}</th>
                      <th className="p-3">{t.school.age}</th>
                      <th className="p-3">{t.school.height}</th>
                      <th className="p-3">{t.school.parentName}</th>
                      <th className="p-3">{t.school.parentPhone}</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                     {activeClass.students.length === 0 ? (
                       <tr><td colSpan={6} className="p-8 text-center text-slate-500">{t.school.noStudents}</td></tr>
                     ) : (
                       activeClass.students.map(student => (
                         <tr key={student.id} className="hover:bg-slate-700/50 transition-colors">
                            <td className="p-3 font-bold text-white">{student.name}</td>
                            <td className="p-3">{student.age}</td>
                            <td className="p-3">{student.height}</td>
                            <td className="p-3 text-court-orange">{student.parentName || '-'}</td>
                            <td className="p-3 font-mono">{student.parentPhone || '-'}</td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => deleteStudent(activeSchoolId!, activeGradeId!, activeClassId!, student.id)}
                                className="text-slate-500 hover:text-red-500 p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                         </tr>
                       ))
                     )}
                  </tbody>
                </table>
             </div>
          </div>

          {/* Add Student Modal */}
          {isAddStudentOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
                 <h3 className="text-xl font-bold text-white mb-4">{t.school.createStudent}</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">{t.school.studentName}</label>
                      <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">{t.school.age}</label>
                      <input type="number" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newStudent.age} onChange={e => setNewStudent({...newStudent, age: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">{t.school.height}</label>
                      <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newStudent.height} onChange={e => setNewStudent({...newStudent, height: e.target.value})} />
                    </div>
                    
                    {/* Dad's Cup Fields */}
                    <div className="col-span-2 border-t border-slate-700 pt-3 mt-1">
                      <h4 className="text-court-orange text-xs font-bold uppercase mb-2">{t.school.dadsCupReady}</h4>
                      <label className="block text-xs text-slate-400 mb-1">{t.school.parentName}</label>
                      <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-3" value={newStudent.parentName} onChange={e => setNewStudent({...newStudent, parentName: e.target.value})} />
                      
                      <label className="block text-xs text-slate-400 mb-1">{t.school.parentPhone}</label>
                      <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} />
                    </div>
                 </div>
                 <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setIsAddStudentOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">{t.common.cancel}</button>
                    <button onClick={addStudent} className="px-4 py-2 bg-court-orange text-white rounded font-bold hover:bg-orange-600">{t.common.save}</button>
                 </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Level 3: Grade Detail / Classes List
    if (activeGradeId && activeSchoolId) {
      const school = schools.find(s => s.id === activeSchoolId);
      const grade = school?.grades?.find(g => g.id === activeGradeId);
      
      if (!school || !grade) return null;

      return (
        <div className="flex flex-col h-full gap-6">
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex justify-between items-center shadow-lg">
             <div className="flex items-center gap-4">
               <button onClick={() => setActiveGradeId(null)} className="text-slate-400 hover:text-white"><ArrowLeft /></button>
               <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    {grade.name}
                    <span className="text-lg text-court-orange font-normal bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                      {calculateGradeLevel(grade.name, language)}
                    </span>
                  </h2>
                  <p className="text-slate-400 text-sm">{school.name}</p>
               </div>
             </div>
             <button 
                onClick={() => setIsAddClassOpen(true)}
                className="bg-court-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
               >
                 <Plus size={18} /> {t.school.createClass}
               </button>
          </div>

          <div className="flex-1 overflow-y-auto">
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
               {grade.classes.map(cls => (
                 <button
                    key={cls.id}
                    onClick={() => setActiveClassId(cls.id)}
                    className="bg-slate-800 p-4 rounded-xl text-left hover:bg-slate-700 transition-all border border-slate-700 hover:border-court-orange group relative"
                 >
                    <div className="font-bold text-white text-lg group-hover:text-court-orange truncate">{cls.name}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 w-fit px-2 py-1 rounded mt-2">
                       <Users size={12} /> {cls.students.length}
                    </div>
                    <div 
                      onClick={(e) => { e.stopPropagation(); deleteClass(school.id, grade.id, cls.id); }}
                      className="absolute top-2 right-2 text-slate-600 hover:text-red-500 p-1"
                    >
                      <Trash2 size={14} />
                    </div>
                 </button>
               ))}
               <button 
                 onClick={() => setIsAddClassOpen(true)}
                 className="bg-slate-800/50 border-2 border-dashed border-slate-700 p-4 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-court-orange hover:border-court-orange transition-all min-h-[120px]"
               >
                 <Plus size={32} />
                 <span className="text-sm mt-2 font-bold">{t.school.createClass}</span>
               </button>
             </div>
          </div>

           {/* Add Class Modal */}
           {isAddClassOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
               <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">{t.school.createClass}</h3>
                  <div className="space-y-4">
                     <div>
                       <label className="block text-sm text-slate-400 mb-1">{t.school.className}</label>
                       <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                     </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                     <button onClick={() => setIsAddClassOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">{t.common.cancel}</button>
                     <button onClick={addClass} className="px-4 py-2 bg-court-orange text-white rounded font-bold hover:bg-orange-600">{t.common.save}</button>
                  </div>
               </div>
            </div>
           )}
        </div>
      );
    }

    // Level 2: School Detail / Grade List
    if (activeSchoolId) {
      const school = schools.find(s => s.id === activeSchoolId);
      if (!school) return null;

      return (
        <div className="flex flex-col h-full gap-6">
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex justify-between items-center shadow-lg">
             <div className="flex items-center gap-4">
               <button onClick={() => setActiveSchoolId(null)} className="text-slate-400 hover:text-white"><ArrowLeft /></button>
               <div>
                  <h2 className="text-2xl font-bold text-white">{school.name}</h2>
                  <p className="text-slate-400 text-sm">{school.region}</p>
               </div>
             </div>
             <button 
                onClick={() => setIsAddGradeOpen(true)}
                className="bg-court-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
               >
                 <Plus size={18} /> {t.school.createGrade}
               </button>
          </div>

          <div className="flex-1 overflow-y-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {(school.grades || []).map(grade => (
                 <button
                    key={grade.id}
                    onClick={() => setActiveGradeId(grade.id)}
                    className="bg-slate-800 p-4 rounded-xl text-left hover:bg-slate-700 transition-all border border-slate-700 hover:border-court-orange group relative flex items-center justify-between"
                 >
                    <div>
                      <div className="font-bold text-white text-lg group-hover:text-court-orange flex items-center gap-2">
                        {grade.name}
                      </div>
                      <div className="mt-1 inline-block text-xs font-semibold text-slate-300 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/50">
                        {calculateGradeLevel(grade.name, language)}
                      </div>
                      <div className="text-sm text-slate-500 mt-2">{grade.classes.length} Classes</div>
                    </div>
                    <div 
                      onClick={(e) => { e.stopPropagation(); deleteGrade(school.id, grade.id); }}
                      className="text-slate-600 hover:text-red-500 p-2"
                    >
                      <Trash2 size={18} />
                    </div>
                 </button>
               ))}
               {(school.grades || []).length === 0 && (
                   <div className="col-span-full p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-xl">
                      {t.school.noGrades}
                   </div>
               )}
             </div>
          </div>

           {/* Add Grade Modal */}
           {isAddGradeOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
               <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">{t.school.createGrade}</h3>
                  <div className="space-y-4">
                     <div>
                       <label className="block text-sm text-slate-400 mb-1">{t.school.gradeName}</label>
                       <input type="text" placeholder="e.g. 2022 Entry / Grade 3" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newGradeName} onChange={e => setNewGradeName(e.target.value)} />
                       <p className="text-xs text-slate-500 mt-1">Tip: Include the year (e.g. "2023") to auto-calculate grade level.</p>
                     </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                     <button onClick={() => setIsAddGradeOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">{t.common.cancel}</button>
                     <button onClick={addGrade} className="px-4 py-2 bg-court-orange text-white rounded font-bold hover:bg-orange-600">{t.common.save}</button>
                  </div>
               </div>
            </div>
           )}
        </div>
      );
    }

    // Level 1: Schools List
    return (
      <div className="flex flex-col h-full gap-6">
         <div className="flex justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700">
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <School className="text-court-orange" /> {t.school.title}
           </h2>
           <button 
             onClick={() => setIsAddSchoolOpen(true)}
             className="bg-court-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
           >
             <Plus size={18} /> {t.school.createSchool}
           </button>
         </div>

         <div className="flex-1 overflow-y-auto space-y-4">
            {schools.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                 <School size={48} className="mb-4 opacity-20" />
                 <p>{t.school.noSchools}</p>
               </div>
            ) : (
               schools.map(school => (
                  <div key={school.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-500 transition-colors">
                     <div className="flex justify-between items-start">
                        <button onClick={() => setActiveSchoolId(school.id)} className="text-left group flex-1">
                           <h3 className="text-xl font-bold text-white group-hover:text-court-orange transition-colors">{school.name}</h3>
                           <p className="text-sm text-slate-400 mb-2">{school.region}</p>
                           <div className="flex gap-4">
                              <span className="text-xs bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
                                <Flag size={12} /> {(school.grades || []).length} Grades
                              </span>
                           </div>
                        </button>
                        <div className="flex items-center gap-2">
                           <button onClick={() => setActiveSchoolId(school.id)} className="text-sm text-court-orange hover:text-white border border-slate-700 hover:bg-slate-700 px-3 py-1 rounded">Manage</button>
                           <button onClick={() => deleteSchool(school.id)} className="text-slate-500 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>

         {/* Add School Modal */}
         {isAddSchoolOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
               <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">{t.school.createSchool}</h3>
                  <div className="space-y-4">
                     <div>
                       <label className="block text-sm text-slate-400 mb-1">{t.school.schoolName}</label>
                       <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)} />
                     </div>
                     <div>
                       <label className="block text-sm text-slate-400 mb-1">{t.school.region}</label>
                       <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newSchoolRegion} onChange={e => setNewSchoolRegion(e.target.value)} />
                     </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                     <button onClick={() => setIsAddSchoolOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">{t.common.cancel}</button>
                     <button onClick={addSchool} className="px-4 py-2 bg-court-orange text-white rounded font-bold hover:bg-orange-600">{t.common.save}</button>
                  </div>
               </div>
            </div>
         )}
      </div>
    );
  };

  const renderTactics = () => {
    // Find active category object
    const currentCategory = TACTIC_CATEGORIES.find(c => c.id === activeCategoryId) || TACTIC_CATEGORIES[0];
    
    // Filter items based on active mode (3x3 vs 5v5)
    const availableItems = currentCategory.items.filter(item => item.modes.includes(activeTacticMode));

    return (
      <div className="flex flex-col h-full gap-4">
        {/* Top Controls: Library & Mode */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm shrink-0 flex flex-col gap-4">
          {/* Row 1: Categories & Mode Switch */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700 pb-2">
             <div className="flex gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
               {TACTIC_CATEGORIES.map(category => (
                 <button
                   key={category.id}
                   onClick={() => setActiveCategoryId(category.id)}
                   className={`text-sm font-bold uppercase tracking-wide px-1 py-2 border-b-2 transition-colors whitespace-nowrap
                     ${activeCategoryId === category.id 
                       ? 'border-court-orange text-white' 
                       : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'}`}
                 >
                   {language === 'en' ? category.label.en : category.label.zh}
                 </button>
               ))}
             </div>
             
             <div className="flex bg-slate-900 rounded-lg p-1 shrink-0">
                <button 
                  onClick={() => setActiveTacticMode('3x3')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTacticMode === '3x3' ? 'bg-court-orange text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >3x3</button>
                <button 
                  onClick={() => setActiveTacticMode('5v5')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTacticMode === '5v5' ? 'bg-court-orange text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >5v5</button>
             </div>
          </div>

          {/* Row 2: Tactic Tags */}
          <div className="flex flex-wrap gap-2">
            {availableItems.length > 0 ? availableItems.map(item => {
              const itemName = language === 'en' ? item.label.en : item.label.zh;
              const isSelected = selectedTacticId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTacticSelect(item.id, itemName)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200
                    ${isSelected 
                      ? 'bg-court-orange border-court-orange text-white shadow-md shadow-orange-900/40' 
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'}`}
                >
                  {itemName}
                </button>
              );
            }) : (
              <div className="text-slate-500 text-sm italic py-1">
                {language === 'zh' ? '该分类下暂无此模式战术' : 'No tactics available for this mode in this category.'}
              </div>
            )}
          </div>
        </div>

        {/* Main Split View */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Board */}
          <div className="lg:col-span-7 flex flex-col gap-4 h-full overflow-y-auto">
            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-lg">
               <TacticsBoard mode={activeTacticMode} language={language} selectedTacticId={selectedTacticId} />
            </div>
          </div>

          {/* Right Column: AI Analysis */}
          <div className="lg:col-span-5 flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <BrainCircuit size={18} className="text-court-accent" /> {t.tactics.analysisTitle}
                </h3>
                <span className="text-xs text-slate-400 px-2 py-1 bg-slate-800 rounded border border-slate-700">{selectedTacticName}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 text-slate-300 text-sm">
                {tacticAnalysis ? (
                  <ReactMarkdown components={{
                    ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-4 marker:text-court-orange" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 mb-4 marker:text-court-orange" {...props} />,
                    li: ({node, ...props}) => <li className="text-slate-300 pl-2" {...props} />,
                    strong: ({node, ...props}) => <strong className="text-white font-bold bg-slate-700/50 px-1 rounded" {...props} />,
                    h1: ({node, ...props}) => <h3 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                    h2: ({node, ...props}) => <h4 className="text-base font-bold text-court-accent mt-3 mb-2" {...props} />,
                    h3: ({node, ...props}) => <h4 className="text-sm font-bold text-white mt-2 mb-1" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-slate-300" {...props} />
                  }}>{tacticAnalysis}</ReactMarkdown>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                    <Layout size={48} className="mb-4 text-slate-600" />
                    <p className="text-center max-w-[80%]">{t.tactics.placeholder}</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLeague = () => {
    // Level 4: Live Match Tracker
    if (activeMatchId && activeLeagueId) {
      const league = leagues.find(l => l.id === activeLeagueId);
      const match = league?.matches.find(m => m.id === activeMatchId);
      const homeTeam = league?.teams.find(t => t.id === match?.homeTeamId);
      const awayTeam = league?.teams.find(t => t.id === match?.awayTeamId);

      if (!match || !homeTeam || !awayTeam) return null;

      const getPlayerName = (id: string) => {
        const p = homeTeam.players.find(p => p.id === id) || awayTeam.players.find(p => p.id === id);
        return p?.name || 'Unknown';
      };

      return (
        <div className="flex flex-col h-full gap-6">
           {/* Header */}
           <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
             <button onClick={() => setActiveMatchId(null)} className="flex items-center gap-2 text-slate-400 hover:text-white">
                <ArrowLeft size={18} /> {t.common.back}
             </button>
             <div className="text-xl font-bold text-white flex gap-4 items-center">
                <span className="text-right w-32 truncate">{homeTeam.name}</span>
                <span className="text-3xl bg-black px-4 py-1 rounded font-mono text-court-orange">{match.homeScore}</span>
                <span className="text-slate-500 text-sm">vs</span>
                <span className="text-3xl bg-black px-4 py-1 rounded font-mono text-court-orange">{match.awayScore}</span>
                <span className="text-left w-32 truncate">{awayTeam.name}</span>
             </div>
             <div className="flex gap-2">
                {match.status !== 'Final' && (
                  <button onClick={() => finishMatch(activeLeagueId!, activeMatchId!)} className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold">{t.league.match.finish}</button>
                )}
                <div className="px-3 py-1 bg-slate-900 rounded text-sm text-court-orange border border-court-orange">{t.league.match.status[match.status.toLowerCase() as keyof typeof t.league.match.status]}</div>
             </div>
           </div>

           {/* Controls */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto">
              {[homeTeam, awayTeam].map((team, idx) => (
                <div key={team.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col">
                   <h3 className={`text-lg font-bold mb-4 border-b border-slate-700 pb-2 ${idx === 0 ? 'text-blue-400' : 'text-red-400'}`}>{team.name}</h3>
                   <div className="space-y-2 flex-1 overflow-y-auto">
                     {team.players.map(player => {
                        const stats = match.stats[player.id] || { pts: 0, reb: 0, ast: 0, fouls: 0 };
                        return (
                          <div key={player.id} className="flex items-center justify-between bg-slate-900/50 p-2 rounded">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-white">{player.name} <span className="text-slate-500 text-xs">#{player.number}</span></span>
                              <div className="text-xs text-slate-400 flex gap-2">
                                <span>{stats.pts} Pts</span>
                                <span>{stats.reb} Reb</span>
                                <span>{stats.ast} Ast</span>
                                <span className={stats.fouls >= 5 ? 'text-red-500' : ''}>{stats.fouls} PF</span>
                              </div>
                            </div>
                            {match.status === 'Live' && (
                               <div className="flex gap-1">
                                 <button onClick={() => updateMatchStat(activeLeagueId!, activeMatchId!, player.id, 'pts', 2)} className="bg-slate-700 hover:bg-court-orange text-white text-xs px-2 py-1 rounded transition-colors">+2</button>
                                 <button onClick={() => updateMatchStat(activeLeagueId!, activeMatchId!, player.id, 'pts', 3)} className="bg-slate-700 hover:bg-court-orange text-white text-xs px-2 py-1 rounded transition-colors">+3</button>
                                 <button onClick={() => updateMatchStat(activeLeagueId!, activeMatchId!, player.id, 'reb', 1)} className="bg-slate-700 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-colors">Reb</button>
                                 <button onClick={() => updateMatchStat(activeLeagueId!, activeMatchId!, player.id, 'ast', 1)} className="bg-slate-700 hover:bg-green-600 text-white text-xs px-2 py-1 rounded transition-colors">Ast</button>
                               </div>
                            )}
                          </div>
                        )
                     })}
                   </div>
                </div>
              ))}
           </div>
        </div>
      );
    }

    // Level 3: Team Detail (Players)
    if (activeTeamId && activeLeagueId) {
      const league = leagues.find(l => l.id === activeLeagueId);
      const team = league?.teams.find(t => t.id === activeTeamId);

      if (!team) return null;

      return (
        <div className="flex flex-col h-full gap-6">
           <div className="flex items-center justify-between">
            <button onClick={() => setActiveTeamId(null)} className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ArrowLeft size={18} /> {t.common.back}
            </button>
            <div className="text-slate-500 text-sm">{league?.name} / {team.name}</div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
               <div>
                 <h2 className="text-3xl font-bold text-white mb-1">{team.name}</h2>
                 <p className="text-slate-400 text-sm">Coach: {team.coach || 'N/A'}</p>
               </div>
               <button 
                onClick={() => setIsAddPlayerOpen(true)}
                className="bg-court-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
               >
                 <UserPlus size={18} /> {t.league.createPlayer}
               </button>
             </div>

             {/* Player List */}
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/50 text-slate-500 uppercase font-medium">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">{t.league.playerName}</th>
                      <th className="p-3">Pos</th>
                      <th className="p-3">H / W</th>
                      <th className="p-3 text-center">PPG / RPG / APG</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                     {team.players.length === 0 ? (
                       <tr><td colSpan={6} className="p-8 text-center text-slate-500">{t.league.noPlayers}</td></tr>
                     ) : (
                       team.players.map(player => (
                         <tr key={player.id} className="hover:bg-slate-700/50 transition-colors group">
                            <td className="p-3 font-mono text-court-orange">{player.number}</td>
                            <td className="p-3 font-bold text-white">{player.name}</td>
                            <td className="p-3">{player.position}</td>
                            <td className="p-3">{player.height} / {player.weight}</td>
                            <td className="p-3 text-center font-mono text-xs">
                              {player.stats.pts} / {player.stats.reb} / {player.stats.ast}
                            </td>
                            <td className="p-3 text-right flex justify-end gap-2">
                              <button 
                                onClick={() => handleGenerateScout(player)}
                                className="text-blue-400 hover:text-blue-300 bg-blue-900/20 px-2 py-1 rounded text-xs border border-blue-900/50"
                              >
                                {t.league.scoutReport}
                              </button>
                              <button 
                                onClick={() => deletePlayer(activeLeagueId!, activeTeamId!, player.id)}
                                className="text-slate-500 hover:text-red-500 p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                         </tr>
                       ))
                     )}
                  </tbody>
                </table>
             </div>
          </div>

          {/* Add Player Modal */}
          {isAddPlayerOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700">
                 <h3 className="text-xl font-bold text-white mb-4">{t.league.createPlayer}</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs text-slate-400 mb-1">{t.league.playerName}</label>
                      <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Number</label>
                      <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newPlayer.number} onChange={e => setNewPlayer({...newPlayer, number: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Position</label>
                      <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newPlayer.position} onChange={e => setNewPlayer({...newPlayer, position: e.target.value})}>
                        <option value="G">Guard</option>
                        <option value="F">Forward</option>
                        <option value="C">Center</option>
                      </select>
                    </div>
                    <div>
                       <label className="block text-xs text-slate-400 mb-1">Height</label>
                       <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newPlayer.height} onChange={e => setNewPlayer({...newPlayer, height: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-xs text-slate-400 mb-1">Weight</label>
                       <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newPlayer.weight} onChange={e => setNewPlayer({...newPlayer, weight: e.target.value})} />
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-700">
                       <label className="block text-xs text-slate-400 mb-2">Initial Stats (Averages)</label>
                       <div className="grid grid-cols-3 gap-2">
                          <input type="number" placeholder="PTS" className="bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newPlayer.pts} onChange={e => setNewPlayer({...newPlayer, pts: e.target.value})} />
                          <input type="number" placeholder="REB" className="bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newPlayer.reb} onChange={e => setNewPlayer({...newPlayer, reb: e.target.value})} />
                          <input type="number" placeholder="AST" className="bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newPlayer.ast} onChange={e => setNewPlayer({...newPlayer, ast: e.target.value})} />
                       </div>
                    </div>
                 </div>
                 <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setIsAddPlayerOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">{t.common.cancel}</button>
                    <button onClick={addPlayer} className="px-4 py-2 bg-court-orange text-white rounded font-bold hover:bg-orange-600">{t.common.save}</button>
                 </div>
              </div>
            </div>
          )}
          
          {/* Scout Report Modal */}
          {activePlayerId && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col border border-slate-700 shadow-2xl">
                 <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900 rounded-t-xl">
                   <h3 className="text-xl font-bold text-white flex items-center gap-2">
                     <BrainCircuit className="text-court-orange" /> {t.league.scoutReport}
                   </h3>
                   <button onClick={() => setActivePlayerId(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-6 text-slate-300">
                    {isGeneratingReport ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-8 h-8 border-4 border-court-orange border-t-transparent rounded-full animate-spin"></div>
                        <p>{t.tactics.analyzing}</p>
                      </div>
                    ) : (
                      <ReactMarkdown components={{
                         h1: ({node, ...props}) => <h3 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                         h2: ({node, ...props}) => <h4 className="text-base font-bold text-court-orange mt-4 mb-2" {...props} />,
                         li: ({node, ...props}) => <li className="ml-4 list-disc" {...props} />
                      }}>{scoutingReport}</ReactMarkdown>
                    )}
                 </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Level 2: League Detail (Teams List)
    if (activeLeagueId) {
      const league = leagues.find(l => l.id === activeLeagueId);
      if (!league) return null;

      return (
        <div className="flex flex-col h-full gap-6">
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex justify-between items-center shadow-lg">
             <div className="flex items-center gap-4">
               <button onClick={() => setActiveLeagueId(null)} className="text-slate-400 hover:text-white"><ArrowLeft /></button>
               <div>
                  <h2 className="text-2xl font-bold text-white">{league.name}</h2>
                  <p className="text-slate-400 text-sm">{t.league.season}: {league.season}</p>
               </div>
             </div>
             <div className="flex bg-slate-900 rounded-lg p-1">
                <button onClick={() => setActiveLeagueTab('teams')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeLeagueTab === 'teams' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}>{t.league.tabs.teams}</button>
                <button onClick={() => setActiveLeagueTab('matches')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeLeagueTab === 'matches' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}>{t.league.tabs.matches}</button>
             </div>
           </div>

           <div className="flex-1 overflow-y-auto">
             {activeLeagueTab === 'teams' ? (
               <div className="space-y-4">
                  <div className="flex justify-end">
                     <button 
                      onClick={() => setIsAddTeamOpen(true)}
                      className="bg-court-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                     >
                       <Plus size={18} /> {t.league.createTeam}
                     </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {league.teams.length === 0 ? (
                        <div className="col-span-full p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-xl">{t.league.noTeams}</div>
                     ) : (
                        league.teams.map(team => (
                          <div key={team.id} onClick={() => setActiveTeamId(team.id)} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-court-orange cursor-pointer transition-all group relative">
                             <div className="flex justify-between items-start mb-2">
                               <h3 className="text-lg font-bold text-white">{team.name}</h3>
                               <button onClick={(e) => {e.stopPropagation(); deleteTeam(activeLeagueId!, team.id)}} className="text-slate-600 hover:text-red-500"><Trash2 size={16}/></button>
                             </div>
                             <div className="text-sm text-slate-400 mb-4">Coach: {team.coach || '-'}</div>
                             <div className="flex justify-between items-center text-xs font-mono bg-slate-900 p-2 rounded">
                                <span className="text-green-400">W: {team.wins}</span>
                                <span className="text-red-400">L: {team.losses}</span>
                                <span className="text-slate-500">{team.players.length} Players</span>
                             </div>
                          </div>
                        ))
                     )}
                  </div>
               </div>
             ) : (
               <div className="space-y-4">
                  <div className="flex justify-end">
                     <button 
                      onClick={() => setIsAddMatchOpen(true)}
                      className="bg-court-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                     >
                       <Calendar size={18} /> {t.league.match.create}
                     </button>
                  </div>
                  <div className="space-y-2">
                    {(!league.matches || league.matches.length === 0) ? (
                        <div className="p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-xl">{t.league.match.noMatches}</div>
                     ) : (
                        league.matches.map(match => {
                           const home = league.teams.find(t => t.id === match.homeTeamId);
                           const away = league.teams.find(t => t.id === match.awayTeamId);
                           if (!home || !away) return null;
                           return (
                             <div key={match.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1 justify-center md:justify-start">
                                   <span className="font-bold text-right w-24 truncate">{home.name}</span>
                                   <div className="bg-slate-900 px-3 py-1 rounded text-court-orange font-mono font-bold flex gap-2">
                                      <span>{match.homeScore}</span>
                                      <span>-</span>
                                      <span>{match.awayScore}</span>
                                   </div>
                                   <span className="font-bold text-left w-24 truncate">{away.name}</span>
                                </div>
                                <div className="text-sm text-slate-500">{match.date}</div>
                                <button 
                                  onClick={() => setActiveMatchId(match.id)}
                                  className={`px-4 py-2 rounded-lg text-sm font-bold w-full md:w-auto ${match.status === 'Final' ? 'bg-slate-700 text-slate-300' : 'bg-green-600 text-white hover:bg-green-500'}`}
                                >
                                  {match.status === 'Scheduled' ? t.league.match.start : match.status === 'Live' ? t.league.match.resume : 'View Stats'}
                                </button>
                             </div>
                           )
                        })
                     )}
                  </div>
               </div>
             )}
           </div>

           {/* Add Team Modal */}
           {isAddTeamOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
               <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">{t.league.createTeam}</h3>
                  <div className="space-y-4">
                     <div>
                       <label className="block text-sm text-slate-400 mb-1">{t.league.teamName}</label>
                       <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                     </div>
                     <div>
                       <label className="block text-sm text-slate-400 mb-1">Coach Name</label>
                       <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newTeamCoach} onChange={e => setNewTeamCoach(e.target.value)} />
                     </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                     <button onClick={() => setIsAddTeamOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">{t.common.cancel}</button>
                     <button onClick={addTeam} className="px-4 py-2 bg-court-orange text-white rounded font-bold hover:bg-orange-600">{t.common.save}</button>
                  </div>
               </div>
            </div>
           )}

            {/* Add Match Modal */}
            {isAddMatchOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
               <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">{t.league.match.create}</h3>
                  <div className="space-y-4">
                     <div>
                       <label className="block text-sm text-slate-400 mb-1">{t.league.match.home}</label>
                       <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newMatch.homeTeamId} onChange={e => setNewMatch({...newMatch, homeTeamId: e.target.value})}>
                          <option value="">Select Team</option>
                          {league.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm text-slate-400 mb-1">{t.league.match.away}</label>
                       <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newMatch.awayTeamId} onChange={e => setNewMatch({...newMatch, awayTeamId: e.target.value})}>
                          <option value="">Select Team</option>
                          {league.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm text-slate-400 mb-1">Date</label>
                       <input type="date" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newMatch.date} onChange={e => setNewMatch({...newMatch, date: e.target.value})} />
                     </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                     <button onClick={() => setIsAddMatchOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">{t.common.cancel}</button>
                     <button onClick={addMatch} className="px-4 py-2 bg-court-orange text-white rounded font-bold hover:bg-orange-600">{t.common.save}</button>
                  </div>
               </div>
            </div>
           )}
        </div>
      );
    }

    // Level 1: Leagues List
    return (
      <div className="flex flex-col h-full gap-6">
         <div className="flex justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700">
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <Trophy className="text-court-orange" /> {t.league.title}
           </h2>
           <button 
             onClick={() => setIsAddLeagueOpen(true)}
             className="bg-court-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
           >
             <Plus size={18} /> {t.league.createLeague}
           </button>
         </div>

         <div className="flex-1 overflow-y-auto space-y-4">
            {leagues.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                 <Trophy size={48} className="mb-4 opacity-20" />
                 <p>{t.league.noLeagues}</p>
               </div>
            ) : (
               leagues.map(league => (
                  <div key={league.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-500 transition-colors">
                     <div className="flex justify-between items-start">
                        <button onClick={() => setActiveLeagueId(league.id)} className="text-left group flex-1">
                           <h3 className="text-xl font-bold text-white group-hover:text-court-orange transition-colors">{league.name}</h3>
                           <p className="text-sm text-slate-400 mb-2">{t.league.season}: {league.season}</p>
                           <div className="flex gap-4">
                              <span className="text-xs bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
                                <Flag size={12} /> {league.teams.length} Teams
                              </span>
                              <span className="text-xs bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
                                <Calendar size={12} /> {league.matches?.length || 0} Matches
                              </span>
                           </div>
                        </button>
                        <div className="flex items-center gap-2">
                           <button onClick={() => setActiveLeagueId(league.id)} className="text-sm text-court-orange hover:text-white border border-slate-700 hover:bg-slate-700 px-3 py-1 rounded">Manage</button>
                           <button onClick={() => deleteLeague(league.id)} className="text-slate-500 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                        </div>
                     </div>
                  </div>
               ))
            )}
         </div>

         {/* Add League Modal */}
         {isAddLeagueOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
               <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">{t.league.createLeague}</h3>
                  <div className="space-y-4">
                     <div>
                       <label className="block text-sm text-slate-400 mb-1">{t.league.leagueName}</label>
                       <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newLeagueName} onChange={e => setNewLeagueName(e.target.value)} />
                     </div>
                     <div>
                       <label className="block text-sm text-slate-400 mb-1">{t.league.season}</label>
                       <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newLeagueSeason} onChange={e => setNewLeagueSeason(e.target.value)} />
                     </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                     <button onClick={() => setIsAddLeagueOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">{t.common.cancel}</button>
                     <button onClick={addLeague} className="px-4 py-2 bg-court-orange text-white rounded font-bold hover:bg-orange-600">{t.common.save}</button>
                  </div>
               </div>
            </div>
         )}
      </div>
    );
  };

  const renderTraining = () => {
    const handleGenerate = async () => {
      if (isPlanLoading) return;
      setIsPlanLoading(true);
      setTrainingPlan('');
      try {
        const plan = await generatePlan(trainingConfig, language);
        setTrainingPlan(plan);
      } catch (e) {
        setTrainingPlan('Failed to generate plan.');
      } finally {
        setIsPlanLoading(false);
      }
    };

    return (
      <div className="flex flex-col h-full gap-6">
         {/* Tabs */}
         <div className="flex bg-slate-800 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'generator' ? 'bg-court-orange text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              {t.training.title}
            </button>
            <button 
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'saved' ? 'bg-court-orange text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              {t.training.savedPlans}
            </button>
         </div>

         {activeTab === 'generator' ? (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
              {/* Configuration Panel */}
              <div className="lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg h-fit">
                 <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                   <ClipboardList className="text-court-orange" /> Configuration
                 </h2>
                 <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">{t.training.duration}</label>
                      <select 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                        value={trainingConfig.days}
                        onChange={(e) => setTrainingConfig({...trainingConfig, days: e.target.value})}
                      >
                         <option value="1">{t.training.daysOptions["1"]}</option>
                         <option value="7">{t.training.daysOptions["7"]}</option>
                         <option value="30">{t.training.daysOptions["30"]}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">{t.training.level}</label>
                      <select 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                        value={trainingConfig.level}
                        onChange={(e) => setTrainingConfig({...trainingConfig, level: e.target.value})}
                      >
                         <option value="Beginner">{t.training.levelOptions["Beginner"]}</option>
                         <option value="Intermediate">{t.training.levelOptions["Intermediate"]}</option>
                         <option value="Advanced">{t.training.levelOptions["Advanced"]}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">{t.training.focus}</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                        placeholder="e.g. Shooting, Defense, Conditioning"
                        value={trainingConfig.focus}
                        onChange={(e) => setTrainingConfig({...trainingConfig, focus: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">{t.training.age}</label>
                      <input 
                        type="number" 
                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                        value={trainingConfig.age}
                        onChange={(e) => setTrainingConfig({...trainingConfig, age: e.target.value})}
                      />
                    </div>
                 </div>
                 <button 
                   onClick={handleGenerate}
                   disabled={isPlanLoading}
                   className="w-full mt-6 bg-court-orange hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition-all shadow-lg flex justify-center items-center gap-2"
                 >
                   {isPlanLoading ? (
                     <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> {t.training.generatingButton}</>
                   ) : (
                     <>{t.training.generateButton}</>
                   )}
                 </button>
              </div>

              {/* Result Panel */}
              <div className="lg:col-span-8 bg-slate-800 rounded-xl border border-slate-700 flex flex-col overflow-hidden shadow-lg">
                 <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    <span className="font-bold text-white">Generated Plan</span>
                    {trainingPlan && (
                      <button onClick={handleSavePlan} className="text-court-orange hover:text-white flex items-center gap-1 text-sm font-bold">
                        <Save size={16} /> {t.training.saveButton}
                      </button>
                    )}
                 </div>
                 <div className="flex-1 overflow-y-auto p-6 text-slate-300">
                    {trainingPlan ? (
                       <ReactMarkdown components={{
                          h1: ({node, ...props}) => <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2" {...props} />,
                          h2: ({node, ...props}) => <h3 className="text-xl font-bold text-court-orange mt-6 mb-3" {...props} />,
                          h3: ({node, ...props}) => <h4 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-4" {...props} />,
                          strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />
                       }}>{trainingPlan}</ReactMarkdown>
                    ) : (
                       <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                          <BookOpen size={48} className="mb-4" />
                          <p className="max-w-xs text-center">{t.training.emptyState}</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto">
              {savedPlans.length === 0 ? (
                 <div className="col-span-full flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                    <Save size={48} className="mb-4 opacity-20" />
                    <p>{t.training.noSaved}</p>
                 </div>
              ) : (
                 savedPlans.map(plan => (
                    <div key={plan.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-court-orange transition-all group flex flex-col h-96 relative">
                       <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-white line-clamp-1">{plan.title}</h3>
                          <button onClick={() => handleDeletePlan(plan.id)} className="text-slate-600 hover:text-red-500"><Trash2 size={16} /></button>
                       </div>
                       <p className="text-xs text-slate-500 mb-4 flex items-center gap-1"><Calendar size={12}/> {plan.date}</p>
                       <div className="flex-1 overflow-y-auto pr-2 text-sm text-slate-400 border-t border-slate-700 pt-2">
                          <ReactMarkdown>{plan.content}</ReactMarkdown>
                       </div>
                    </div>
                 ))
              )}
           </div>
         )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg"></div>
          <span className="text-xl font-bold tracking-tight text-white">Gemini<span className="text-court-orange">Courtside</span></span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavItem view={ViewState.HOME} icon={BrainCircuit} label={t.nav.aiCoach} />
          <NavItem view={ViewState.SKILLS} icon={Dumbbell} label={t.nav.skills} />
          <NavItem view={ViewState.TACTICS} icon={Layout} label={t.nav.tactics} />
          <NavItem view={ViewState.LEAGUE} icon={Trophy} label={t.nav.league} />
          <NavItem view={ViewState.SCHOOL} icon={School} label={t.nav.school} />
          <NavItem view={ViewState.TRAINING} icon={BookOpen} label={t.nav.training} />
        </nav>

        <div className="mt-auto">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white p-2 w-full rounded hover:bg-slate-800 transition-colors mb-4"
          >
            <Globe size={16} />
            {language === 'en' ? 'Switch to 中文' : '切换到 English'}
          </button>
          <div className="p-4 bg-slate-800/50 rounded-lg text-xs text-slate-500">
            {t.common.footer}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 border-b border-slate-800 z-50 flex justify-between items-center p-4">
        <span className="font-bold text-lg">Gemini<span className="text-court-orange">Courtside</span></span>
        <div className="flex gap-4 items-center">
          <button onClick={toggleLanguage} className="text-slate-300">
             <Globe size={20} />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900 z-40 pt-20 px-4 space-y-2">
          <NavItem view={ViewState.HOME} icon={BrainCircuit} label={t.nav.aiCoach} />
          <NavItem view={ViewState.SKILLS} icon={Dumbbell} label={t.nav.skills} />
          <NavItem view={ViewState.TACTICS} icon={Layout} label={t.nav.tactics} />
          <NavItem view={ViewState.LEAGUE} icon={Trophy} label={t.nav.league} />
          <NavItem view={ViewState.SCHOOL} icon={School} label={t.nav.school} />
          <NavItem view={ViewState.TRAINING} icon={BookOpen} label={t.nav.training} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative pt-16 md:pt-0">
        <div className="h-full p-4 md:p-8 max-w-7xl mx-auto">
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
