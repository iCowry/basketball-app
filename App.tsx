
import React, { useState, useEffect } from 'react';
import { Layout, Dumbbell, BookOpen, Trophy, PlayCircle, Menu, X, BrainCircuit, Globe, ChevronDown, ChevronRight, Check, Save, Trash2, Plus, Users, ArrowLeft, ClipboardList, Calendar, Play, Circle, Flag } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import TacticsBoard from './components/TacticsBoard';
import { ViewState, SkillCategory, TacticMode, Language, SavedPlan, SkillItem, ManagedLeague, ManagedTeam, ManagedPlayer, ManagedMatch, MatchPlayerStats } from './types';
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
  
  // Form states
  const [isAddLeagueOpen, setIsAddLeagueOpen] = useState(false);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueSeason, setNewLeagueSeason] = useState('');
  
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCoach, setNewTeamCoach] = useState('');
  
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '', position: 'G', height: '', weight: '', pts: '0', reb: '0', ast: '0' });

  const [newMatch, setNewMatch] = useState({ homeTeamId: '', awayTeamId: '', date: '' });

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

  // Load Saved Plans & Leagues
  useEffect(() => {
    const saved = localStorage.getItem('gemini_training_plans');
    if (saved) {
      setSavedPlans(JSON.parse(saved));
    }
    const savedLeagues = localStorage.getItem('gemini_managed_leagues');
    if (savedLeagues) {
      setLeagues(JSON.parse(savedLeagues));
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

  // League Management Functions
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
        setActiveLeagueId(null); // Reset league view on nav
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
    // Level 4: Live Match Tracker (Full Screen Overlay)
    if (activeMatchId && activeLeagueId) {
      const activeLeague = leagues.find(l => l.id === activeLeagueId);
      const match = activeLeague?.matches?.find(m => m.id === activeMatchId);
      
      if (!activeLeague || !match) return null;

      const homeTeam = activeLeague.teams.find(t => t.id === match.homeTeamId);
      const awayTeam = activeLeague.teams.find(t => t.id === match.awayTeamId);

      return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
           {/* Live Header */}
           <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center shadow-md">
             <button onClick={() => setActiveMatchId(null)} className="text-slate-400 hover:text-white flex items-center gap-2">
               <ArrowLeft /> {t.common.back}
             </button>
             <div className="flex items-center gap-8">
               <div className="text-right">
                 <div className="text-2xl font-bold text-white">{match.homeScore}</div>
                 <div className="text-xs text-court-orange font-bold uppercase">{homeTeam?.name}</div>
               </div>
               <div className="text-slate-500 text-sm font-bold">VS</div>
               <div className="text-left">
                 <div className="text-2xl font-bold text-white">{match.awayScore}</div>
                 <div className="text-xs text-white font-bold uppercase">{awayTeam?.name}</div>
               </div>
             </div>
             <button 
                onClick={() => finishMatch(activeLeagueId, match.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold"
             >
               {t.league.match.finish}
             </button>
           </div>

           {/* Game Controls */}
           <div className="flex-1 overflow-y-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Home Team Controls */}
             <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <h3 className="text-court-orange font-bold mb-4 border-b border-slate-800 pb-2">{t.league.match.home}: {homeTeam?.name}</h3>
                <div className="space-y-4">
                  {homeTeam?.players.map(player => {
                    const stats = match.stats[player.id] || { pts: 0, reb: 0, ast: 0, fouls: 0 };
                    return (
                      <div key={player.id} className="bg-slate-800 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-white">#{player.number} {player.name}</span>
                          <span className="text-xs text-slate-400">{stats.pts}pts / {stats.reb}reb / {stats.ast}ast</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <button onClick={() => updateMatchStat(activeLeagueId, match.id, player.id, 'pts', 1)} className="bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded">+1</button>
                          <button onClick={() => updateMatchStat(activeLeagueId, match.id, player.id, 'pts', 2)} className="bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded">+2</button>
                          <button onClick={() => updateMatchStat(activeLeagueId, match.id, player.id, 'pts', 3)} className="bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded">+3</button>
                          <div className="flex flex-col gap-1">
                             <button onClick={() => updateMatchStat(activeLeagueId, match.id, player.id, 'reb', 1)} className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 text-[10px] py-1 rounded">REB</button>
                             <button onClick={() => updateMatchStat(activeLeagueId, match.id, player.id, 'ast', 1)} className="bg-green-900/50 hover:bg-green-800 text-green-200 text-[10px] py-1 rounded">AST</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
             </div>

             {/* Away Team Controls */}
             <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
                <h3 className="text-white font-bold mb-4 border-b border-slate-800 pb-2">{t.league.match.away}: {awayTeam?.name}</h3>
                <div className="space-y-4">
                  {awayTeam?.players.map(player => {
                    const stats = match.stats[player.id] || { pts: 0, reb: 0, ast: 0, fouls: 0 };
                    return (
                      <div key={player.id} className="bg-slate-800 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-white">#{player.number} {player.name}</span>
                          <span className="text-xs text-slate-400">{stats.pts}pts / {stats.reb}reb / {stats.ast}ast</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <button onClick={() => updateMatchStat(activeLeagueId, match.id, player.id, 'pts', 1)} className="bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded">+1</button>
                          <button onClick={() => updateMatchStat(activeLeagueId, match.id, player.id, 'pts', 2)} className="bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded">+2</button>
                          <button onClick={() => updateMatchStat(activeLeagueId, match.id, player.id, 'pts', 3)} className="bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded">+3</button>
                          <div className="flex flex-col gap-1">
                             <button onClick={() => updateMatchStat(activeLeagueId, match.id, player.id, 'reb', 1)} className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 text-[10px] py-1 rounded">REB</button>
                             <button onClick={() => updateMatchStat(activeLeagueId, match.id, player.id, 'ast', 1)} className="bg-green-900/50 hover:bg-green-800 text-green-200 text-[10px] py-1 rounded">AST</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
             </div>
           </div>
        </div>
      );
    }

    // Level 3: Player Details (Bottom Sheet / Modal)
    if (activePlayerId) {
      const activeLeague = leagues.find(l => l.id === activeLeagueId);
      const activeTeam = activeLeague?.teams.find(t => t.id === activeTeamId);
      const player = activeTeam?.players.find(p => p.id === activePlayerId);
      
      if (!player) return null;

      return (
        <div className="flex flex-col h-full gap-6">
           <button onClick={() => setActivePlayerId(null)} className="flex items-center gap-2 text-slate-400 hover:text-white w-fit">
             <ArrowLeft size={18} /> {t.common.back}
           </button>
           
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
             <div className="flex justify-between items-start">
               <div>
                  <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                    <span className="text-court-orange">#{player.number}</span> {player.name}
                  </h2>
                  <p className="text-slate-400">{activeTeam?.name} | {player.position} | {player.height} | {player.weight}</p>
               </div>
               <button 
                onClick={() => handleGenerateScout(player)}
                disabled={isGeneratingReport}
                className="bg-court-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
               >
                 <BrainCircuit size={18} /> {t.league.generateScout}
               </button>
             </div>
             
             <div className="grid grid-cols-3 gap-4 mt-8">
               <div className="bg-slate-900 p-4 rounded-lg text-center border border-slate-700">
                 <div className="text-xs text-slate-500 uppercase tracking-wide">PTS</div>
                 <div className="text-2xl font-bold text-white">{player.stats.pts}</div>
               </div>
               <div className="bg-slate-900 p-4 rounded-lg text-center border border-slate-700">
                 <div className="text-xs text-slate-500 uppercase tracking-wide">REB</div>
                 <div className="text-2xl font-bold text-white">{player.stats.reb}</div>
               </div>
               <div className="bg-slate-900 p-4 rounded-lg text-center border border-slate-700">
                 <div className="text-xs text-slate-500 uppercase tracking-wide">AST</div>
                 <div className="text-2xl font-bold text-white">{player.stats.ast}</div>
               </div>
             </div>

             {/* Scouting Report Section */}
             {(scoutingReport || isGeneratingReport) && (
               <div className="mt-8 pt-6 border-t border-slate-700">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   <ClipboardList className="text-court-orange" /> {t.league.scoutReport}
                 </h3>
                 <div className="bg-slate-900/50 p-6 rounded-lg text-slate-300 text-sm leading-relaxed border border-slate-700/50">
                    {isGeneratingReport ? (
                      <div className="flex items-center gap-2 text-slate-500">
                        <BrainCircuit className="animate-pulse" /> Generating analysis...
                      </div>
                    ) : (
                      <ReactMarkdown>{scoutingReport}</ReactMarkdown>
                    )}
                 </div>
               </div>
             )}
           </div>
        </div>
      );
    }

    // Level 2: Team Roster View
    if (activeTeamId) {
      const activeLeague = leagues.find(l => l.id === activeLeagueId);
      const team = activeLeague?.teams.find(t => t.id === activeTeamId);

      return (
        <div className="flex flex-col h-full gap-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setActiveTeamId(null)} className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ArrowLeft size={18} /> {t.common.back}
            </button>
            <div className="text-slate-500 text-sm">{activeLeague?.name} / {activeLeague?.season}</div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
               <div>
                 <h2 className="text-2xl font-bold text-white mb-1">{team?.name}</h2>
                 <p className="text-slate-400 text-sm">Coach: {team?.coach || 'N/A'}</p>
               </div>
               <button 
                onClick={() => setIsAddPlayerOpen(true)}
                className="bg-court-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
               >
                 <Plus size={18} /> {t.league.createPlayer}
               </button>
             </div>

             {/* Players List */}
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-300">
                 <thead className="bg-slate-900/50 text-slate-500 uppercase font-medium">
                   <tr>
                     <th className="p-3">#</th>
                     <th className="p-3">{t.league.playerName}</th>
                     <th className="p-3">Pos</th>
                     <th className="p-3 text-center">PTS</th>
                     <th className="p-3 text-center">REB</th>
                     <th className="p-3 text-center">AST</th>
                     <th className="p-3 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-700">
                   {team?.players.length === 0 ? (
                     <tr>
                       <td colSpan={7} className="p-8 text-center text-slate-500">{t.league.noPlayers}</td>
                     </tr>
                   ) : (
                     team?.players.map(p => (
                       <tr key={p.id} onClick={() => { setActivePlayerId(p.id); setScoutingReport(p.scoutingReport || ''); }} className="hover:bg-slate-700/50 cursor-pointer transition-colors">
                         <td className="p-3 font-mono text-court-orange">{p.number}</td>
                         <td className="p-3 font-bold text-white">{p.name}</td>
                         <td className="p-3">{p.position}</td>
                         <td className="p-3 text-center">{p.stats.pts}</td>
                         <td className="p-3 text-center">{p.stats.reb}</td>
                         <td className="p-3 text-center">{p.stats.ast}</td>
                         <td className="p-3 text-right">
                           <button 
                             onClick={(e) => { e.stopPropagation(); deletePlayer(activeLeagueId!, activeTeamId!, p.id); }}
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
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-slate-400 mb-1">#</label>
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
                    <label className="block text-xs text-slate-400 mb-1">Height/Weight</label>
                    <input type="text" placeholder="6'6 / 220lbs" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newPlayer.height} onChange={e => setNewPlayer({...newPlayer, height: e.target.value})} />
                  </div>
                  {/* Stats Input */}
                  <div className="col-span-2">
                     <label className="block text-xs text-slate-400 mb-1 border-t border-slate-700 pt-2 mt-1">{t.league.stats} (AVG)</label>
                     <div className="flex gap-2">
                       <input type="number" placeholder="PTS" className="w-1/3 bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newPlayer.pts} onChange={e => setNewPlayer({...newPlayer, pts: e.target.value})} />
                       <input type="number" placeholder="REB" className="w-1/3 bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newPlayer.reb} onChange={e => setNewPlayer({...newPlayer, reb: e.target.value})} />
                       <input type="number" placeholder="AST" className="w-1/3 bg-slate-900 border border-slate-600 rounded p-2 text-white" value={newPlayer.ast} onChange={e => setNewPlayer({...newPlayer, ast: e.target.value})} />
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
        </div>
      );
    }

    // Level 1: Leagues Dashboard / Detail
    // If activeLeagueId is selected but no Team selected, show League Dashboard
    if (activeLeagueId) {
      const league = leagues.find(l => l.id === activeLeagueId);
      if (!league) return null;

      return (
        <div className="flex flex-col h-full gap-6">
           {/* League Header */}
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex justify-between items-center shadow-lg">
             <div className="flex items-center gap-4">
               <button onClick={() => setActiveLeagueId(null)} className="text-slate-400 hover:text-white"><ArrowLeft /></button>
               <div>
                  <h2 className="text-2xl font-bold text-white">{league.name}</h2>
                  <p className="text-slate-400 text-sm">{league.season}</p>
               </div>
             </div>
             {/* Tab Switcher */}
             <div className="flex bg-slate-900 rounded-lg p-1">
                <button 
                  onClick={() => setActiveLeagueTab('teams')}
                  className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${activeLeagueTab === 'teams' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  {t.league.tabs.teams}
                </button>
                <button 
                  onClick={() => setActiveLeagueTab('matches')}
                  className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${activeLeagueTab === 'matches' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  {t.league.tabs.matches}
                </button>
             </div>
           </div>

           {activeLeagueTab === 'teams' ? (
              <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {league.teams.map(team => (
                      <button 
                        key={team.id}
                        onClick={() => setActiveTeamId(team.id)}
                        className="bg-slate-800 p-4 rounded-xl text-left hover:bg-slate-700 transition-all border border-slate-700 hover:border-court-orange group"
                      >
                         <div className="font-bold text-white text-lg group-hover:text-court-orange truncate">{team.name}</div>
                         <div className="text-sm text-slate-500">{team.players.length} Players</div>
                         <div className="mt-4 flex gap-2">
                            <span className="text-xs bg-slate-900 px-2 py-1 rounded text-green-400">{team.wins} W</span>
                            <span className="text-xs bg-slate-900 px-2 py-1 rounded text-red-400">{team.losses} L</span>
                         </div>
                      </button>
                    ))}
                    
                    <button 
                      onClick={() => setIsAddTeamOpen(true)}
                      className="bg-slate-800/50 border-2 border-dashed border-slate-700 p-4 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-court-orange hover:border-court-orange transition-all min-h-[140px]"
                    >
                      <Plus size={32} />
                      <span className="text-sm mt-2 font-bold">{t.league.createTeam}</span>
                    </button>
                  </div>
              </div>
           ) : (
              // Matches Tab
              <div className="flex-1 overflow-y-auto">
                 <div className="flex justify-end mb-4">
                    <button 
                      onClick={() => setIsAddMatchOpen(true)}
                      className="bg-court-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                      <Calendar size={18} /> {t.league.match.create}
                    </button>
                 </div>
                 
                 <div className="space-y-3">
                   {(!league.matches || league.matches.length === 0) ? (
                     <p className="text-center text-slate-500 py-8">{t.league.match.noMatches}</p>
                   ) : (
                     league.matches.map(match => {
                       const home = league.teams.find(t => t.id === match.homeTeamId);
                       const away = league.teams.find(t => t.id === match.awayTeamId);
                       return (
                         <div key={match.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-center hover:bg-slate-750">
                            <div className="flex items-center gap-6 flex-1">
                               <div className="text-right w-1/3">
                                 <div className="font-bold text-white">{home?.name}</div>
                                 <div className="text-2xl font-bold text-slate-300">{match.homeScore}</div>
                               </div>
                               <div className="text-center w-20 shrink-0">
                                  <div className="text-xs text-slate-500 mb-1">{match.date}</div>
                                  <div className={`text-xs font-bold px-2 py-1 rounded ${match.status === 'Live' ? 'bg-red-900 text-red-400 animate-pulse' : match.status === 'Final' ? 'bg-slate-900 text-slate-400' : 'bg-blue-900 text-blue-400'}`}>
                                    {match.status}
                                  </div>
                               </div>
                               <div className="text-left w-1/3">
                                 <div className="font-bold text-white">{away?.name}</div>
                                 <div className="text-2xl font-bold text-slate-300">{match.awayScore}</div>
                               </div>
                            </div>
                            <div className="ml-4 pl-4 border-l border-slate-700">
                               {match.status !== 'Final' && (
                                 <button 
                                   onClick={() => setActiveMatchId(match.id)}
                                   className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-bold text-white transition-colors ${match.status === 'Live' ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'}`}
                                 >
                                   <Play size={16} /> {match.status === 'Live' ? t.league.match.resume : t.league.match.start}
                                 </button>
                               )}
                            </div>
                         </div>
                       )
                     })
                   )}
                 </div>
              </div>
           )}

            {/* Add Team Modal */}
          {isAddTeamOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
                 <h3 className="text-xl font-bold text-white mb-4">{t.league.createTeam}</h3>
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm text-slate-400 mb-1">{t.league.teamName}</label>
                     <input 
                      type="text" 
                      className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-court-orange outline-none" 
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                     />
                   </div>
                   <div>
                     <label className="block text-sm text-slate-400 mb-1">Coach Name</label>
                     <input 
                      type="text" 
                      className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-court-orange outline-none" 
                      value={newTeamCoach}
                      onChange={(e) => setNewTeamCoach(e.target.value)}
                     />
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
                <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
                   <h3 className="text-xl font-bold text-white mb-4">{t.league.match.create}</h3>
                   <div className="space-y-4">
                     <div>
                        <label className="block text-sm text-slate-400 mb-1">{t.league.match.home}</label>
                        <select 
                          className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                          value={newMatch.homeTeamId}
                          onChange={(e) => setNewMatch({...newMatch, homeTeamId: e.target.value})}
                        >
                          <option value="">Select Team</option>
                          {league.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm text-slate-400 mb-1">{t.league.match.away}</label>
                        <select 
                          className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                          value={newMatch.awayTeamId}
                          onChange={(e) => setNewMatch({...newMatch, awayTeamId: e.target.value})}
                        >
                          <option value="">Select Team</option>
                          {league.teams.filter(t => t.id !== newMatch.homeTeamId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                     </div>
                   </div>
                   <div className="flex justify-end gap-3 mt-6">
                     <button onClick={() => setIsAddMatchOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">{t.common.cancel}</button>
                     <button onClick={addMatch} disabled={!newMatch.homeTeamId || !newMatch.awayTeamId} className="px-4 py-2 bg-court-orange text-white rounded font-bold hover:bg-orange-600 disabled:opacity-50">{t.common.save}</button>
                   </div>
                </div>
              </div>
           )}
        </div>
      );
    }

    // Default: Leagues List
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

        {/* Leagues List */}
        <div className="flex-1 overflow-y-auto space-y-4">
           {leagues.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                <Trophy size={48} className="mb-4 opacity-20" />
                <p>{t.league.noLeagues}</p>
             </div>
           ) : (
             leagues.map(league => (
               <div key={league.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-500 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <button onClick={() => setActiveLeagueId(league.id)} className="text-left group">
                      <h3 className="text-xl font-bold text-white group-hover:text-court-orange transition-colors">{league.name}</h3>
                      <p className="text-sm text-slate-400">{league.season} • {league.teams.length} Teams</p>
                    </button>
                    <div className="flex items-center gap-2">
                       <button onClick={() => setActiveLeagueId(league.id)} className="text-sm text-court-orange hover:text-white border border-slate-700 hover:bg-slate-700 px-3 py-1 rounded">Manage</button>
                       <button onClick={() => deleteLeague(league.id)} className="text-slate-500 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  
                  {/* Teams Mini-Grid Preview */}
                  {league.teams.length > 0 && (
                     <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {league.teams.slice(0, 5).map(team => (
                           <div key={team.id} className="bg-slate-900 px-3 py-2 rounded text-xs text-slate-300 whitespace-nowrap border border-slate-800">
                              {team.name}
                           </div>
                        ))}
                        {league.teams.length > 5 && <div className="text-xs text-slate-500 flex items-center px-2">+{league.teams.length - 5} more</div>}
                     </div>
                  )}
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
                   <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-court-orange outline-none" 
                    value={newLeagueName}
                    onChange={(e) => setNewLeagueName(e.target.value)}
                   />
                 </div>
                 <div>
                   <label className="block text-sm text-slate-400 mb-1">{t.league.season}</label>
                   <input 
                    type="text" 
                    placeholder="2024-2025"
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-court-orange outline-none" 
                    value={newLeagueSeason}
                    onChange={(e) => setNewLeagueSeason(e.target.value)}
                   />
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

  const renderTraining = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Sidebar: Config & Saved Plans */}
      <div className="lg:col-span-4 bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-full overflow-hidden">
        <div className="flex border-b border-slate-700">
          <button 
            onClick={() => setActiveTab('generator')}
            className={`flex-1 py-3 font-bold text-sm transition-colors ${activeTab === 'generator' ? 'bg-slate-700 text-white border-b-2 border-court-orange' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t.training.title}
          </button>
          <button 
             onClick={() => setActiveTab('saved')}
             className={`flex-1 py-3 font-bold text-sm transition-colors ${activeTab === 'saved' ? 'bg-slate-700 text-white border-b-2 border-court-orange' : 'text-slate-400 hover:text-slate-200'}`}
          >
             {t.training.savedPlans}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'generator' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t.training.duration}</label>
                <select 
                  value={trainingConfig.days}
                  onChange={(e) => setTrainingConfig({...trainingConfig, days: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-court-orange focus:outline-none"
                >
                  <option value="1">{t.training.daysOptions["1"]}</option>
                  <option value="7">{t.training.daysOptions["7"]}</option>
                  <option value="30">{t.training.daysOptions["30"]}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t.training.level}</label>
                <select 
                  value={trainingConfig.level}
                  onChange={(e) => setTrainingConfig({...trainingConfig, level: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-court-orange focus:outline-none"
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
                  value={trainingConfig.focus}
                  onChange={(e) => setTrainingConfig({...trainingConfig, focus: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-court-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">{t.training.age}</label>
                <input 
                  type="number"
                  value={trainingConfig.age}
                  onChange={(e) => setTrainingConfig({...trainingConfig, age: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-court-orange focus:outline-none"
                />
              </div>
              
              <button 
                onClick={async () => {
                  setIsPlanLoading(true);
                  try {
                    const plan = await generatePlan(trainingConfig, language);
                    setTrainingPlan(plan);
                  } catch (e) {
                    setTrainingPlan("Failed to generate plan. Please check API key.");
                  } finally {
                    setIsPlanLoading(false);
                  }
                }}
                disabled={isPlanLoading}
                className="w-full bg-court-orange text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors mt-4 disabled:opacity-50"
              >
                {isPlanLoading ? t.training.generatingButton : t.training.generateButton}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedPlans.length === 0 ? (
                <p className="text-slate-500 text-center py-8">{t.training.noSaved}</p>
              ) : (
                savedPlans.map(plan => (
                  <div key={plan.id} className="bg-slate-900 border border-slate-700 rounded-lg p-3 hover:border-slate-500 transition-colors">
                    <div 
                      className="cursor-pointer mb-2"
                      onClick={() => {
                        setTrainingPlan(plan.content);
                        if (window.innerWidth < 1024) {
                           // On mobile, maybe scroll to content or something, but here we just load it
                        }
                      }}
                    >
                      <h4 className="font-bold text-slate-200 text-sm">{plan.title}</h4>
                      <p className="text-xs text-slate-500">{plan.date}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2 border-t border-slate-800 pt-2">
                       <button onClick={() => setTrainingPlan(plan.content)} className="text-xs text-court-orange hover:text-white font-medium">Load</button>
                       <button onClick={() => handleDeletePlan(plan.id)} className="text-xs text-red-500 hover:text-red-400">
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Plan View */}
      <div className="lg:col-span-8 bg-slate-800 rounded-xl border border-slate-700 h-full overflow-hidden flex flex-col">
        {trainingPlan ? (
           <>
             <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
                <h3 className="font-bold text-white flex items-center gap-2">
                   <BookOpen size={18} className="text-court-orange" /> Generated Plan
                </h3>
                <button 
                  onClick={handleSavePlan}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-court-orange text-white rounded text-sm transition-colors"
                >
                  <Save size={16} /> {t.training.saveButton}
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 prose prose-invert max-w-none">
               <ReactMarkdown>{trainingPlan}</ReactMarkdown>
             </div>
           </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <BookOpen size={64} className="mb-4 opacity-20" />
            <p>{t.training.emptyState}</p>
          </div>
        )}
      </div>
    </div>
  );

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
          {currentView === ViewState.TRAINING && renderTraining()}
        </div>
      </main>
    </div>
  );
};

export default App;
