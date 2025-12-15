

import { SkillCategory, Language, TacticCategory, SkillLibrary } from "./types";

export const SYSTEM_INSTRUCTION = `
You are an expert basketball coach and analyst for "Gemini Courtside AI". 
Your tone is professional, authoritative, encouraging, and concise.

Key Responsibilities:
1. **Skill Breakdown**: Explain techniques with "Key Points", "Step-by-Step Breakdown", and "Common Errors + Corrections".
2. **Tactics**: Explain strategies (Pick & Roll, Horns, etc.) with Purpose, Execution, and Counter-tactics.
3. **League Analysis**: Provide scouting reports for *user-created* players. Analyze their stats and attributes to suggest playstyle and improvement areas.
4. **Training Plans**: Generate structured training sessions (Warm-up, Skill, Physical, Cool-down).

Formatting Rules:
- Use Markdown for readability.
- Use bullet points for steps.
- Keep responses directly usable (e.g., "Do this," "Watch for that").
- If asked for a training plan, format it clearly with time durations.

Strictly NO real-time score updates.
`;

export const TACTIC_CATEGORIES: TacticCategory[] = [
  {
    id: 'offense_basic',
    label: { en: 'Basic Offense', zh: '基础进攻' },
    items: [
      // 5v5
      { id: 'pnr', label: { en: 'Pick & Roll (vs Drop)', zh: '挡拆配合 (Pick & Roll)' }, modes: ['5v5'] },
      { id: 'iso', label: { en: 'Isolation', zh: '拉开单打 (Isolation)' }, modes: ['5v5'] },
      { id: 'give_go', label: { en: 'Give & Go', zh: '传切配合 (Give & Go)' }, modes: ['5v5'] },
      { id: 'dho', label: { en: 'Dribble Hand-Off', zh: '手递手 (DHO)' }, modes: ['5v5'] },
      // 3x3 Specifics
      { id: 'check_ball_3x3', label: { en: 'Check Ball (Start)', zh: '洗球开局 (Check Ball)' }, modes: ['3x3'] },
      { id: 'pnr_3x3', label: { en: 'High PnR (3x3)', zh: '高位挡拆 (3x3)' }, modes: ['3x3'] },
      { id: 'iso_3x3', label: { en: 'Isolation (Clear)', zh: '拉开单打 (3x3 Iso)' }, modes: ['3x3'] },
      { id: 'give_go_3x3', label: { en: 'Give & Go (3x3)', zh: '传切 (3x3)' }, modes: ['3x3'] },
      { id: 'dho_3x3', label: { en: 'Hand Off (3x3)', zh: '手递手 (3x3 DHO)' }, modes: ['3x3'] },
      { id: 'screen_away_3x3', label: { en: 'Screen Away', zh: '无球掩护 (Screen Away)' }, modes: ['3x3'] },
      { id: 'backdoor_3x3', label: { en: 'Backdoor Cut', zh: '反跑切入 (Backdoor)' }, modes: ['3x3'] },
    ]
  },
  {
    id: 'offense_set',
    label: { en: 'Set Plays', zh: '战术套路' },
    items: [
      // 5v5
      { id: 'horns', label: { en: 'Horns', zh: '牛角战术 (Horns)' }, modes: ['5v5'] },
      { id: 'spain_pnr', label: { en: 'Spain Pick & Roll', zh: '西班牙挡拆 (Spain PnR)' }, modes: ['5v5'] },
      { id: 'ucla_cut', label: { en: 'UCLA Cut', zh: 'UCLA 切入' }, modes: ['5v5'] },
      { id: '5out', label: { en: '5-Out Motion', zh: '5外动态进攻 (5-Out)' }, modes: ['5v5'] },
      { id: 'elevator', label: { en: 'Elevator Doors', zh: '电梯门 (Elevator)' }, modes: ['5v5'] },
      // 3x3 Specifics
      { id: 'split_cut_3x3', label: { en: 'Post Split', zh: '内线分球切入 (Split)' }, modes: ['3x3'] },
    ]
  },
  {
    id: 'defense',
    label: { en: 'Defense', zh: '防守体系' },
    items: [
      // 5v5
      { id: '2_3_zone', label: { en: '2-3 Zone', zh: '2-3 联防' }, modes: ['5v5'] },
      { id: '3_2_zone', label: { en: '3-2 Zone', zh: '3-2 联防' }, modes: ['5v5'] },
      { id: '1_3_1_zone', label: { en: '1-3-1 Zone', zh: '1-3-1 联防' }, modes: ['5v5'] },
      { id: 'box_and_1', label: { en: 'Box and 1', zh: '一盯四联 (Box-and-1)' }, modes: ['5v5'] },
      { id: 'man', label: { en: 'Man to Man Switch', zh: '人盯人换防' }, modes: ['5v5'] },
      // 3x3
      { id: 'man_3x3', label: { en: 'Man to Man (Shell)', zh: '人盯人 (3x3 Shell)' }, modes: ['3x3'] },
    ]
  }
];

export const SKILL_LIBRARY: SkillLibrary = {
  [SkillCategory.TECHNICAL]: [
    {
      id: 'shooting',
      label: { en: 'Shooting', zh: '投篮技术' },
      skills: [
        {
          id: 'beef_form',
          label: { en: 'Form Shooting (B.E.E.F)', zh: '基础投篮姿势 (B.E.E.F)' },
          description: {
            en: 'The absolute foundation of shooting mechanics. Perfect for rookies to build muscle memory close to the basket.',
            zh: '投篮机制的绝对基础。非常适合初学者在篮下建立肌肉记忆。'
          },
          steps: {
            en: ['Balance: Feet shoulder-width, knees bent.', 'Eyes: Focused on the target (rim hooks).', 'Elbow: Under the ball, forming an L-shape.', 'Follow-through: Snap wrist, hold the "goose neck".'],
            zh: ['平衡 (Balance)：双脚与肩同宽，屈膝。', '视线 (Eyes)：专注于目标（篮筐挂钩）。', '肘部 (Elbow)：在球下方，呈L形。', '跟随 (Follow-through)：压腕，保持"鹅颈"手型。']
          },
          mistakes: {
            en: ['Elbow sticking out (Chicken wing).', 'Palm touching the ball (should be finger pads).', 'Not holding the follow-through.'],
            zh: ['肘部外翻（鸡翅膀）。', '手掌心触球（应用指根和指尖）。', '出手后立即缩手。']
          }
        },
        {
          id: 'jump_shot',
          label: { en: 'Jump Shot', zh: '跳投' },
          description: {
            en: 'The fundamental scoring mechanism. Requires fluid energy transfer from feet to fingertips.',
            zh: '最基本的得分手段。需要从脚到指尖的流畅能量传递。'
          },
          steps: {
            en: ['Feet shoulder-width apart, knees bent.', 'Elbow tucked in (L-shape).', 'Release at the apex of jump.', 'Follow through with "goose neck" wrist.'],
            zh: ['双脚与肩同宽，膝盖弯曲。', '肘部收紧呈L形。', '在起跳最高点出手。', '手腕压下跟随动作（鹅颈）。']
          },
          mistakes: {
            en: ['Elbow flaring out.', 'Flat arc (shooting from chest).', 'Drifting sideways.'],
            zh: ['肘部外翻。', '弧度太平（推射）。', '身体侧向漂移。']
          }
        },
        {
          id: 'catch_shoot',
          label: { en: 'Catch & Shoot', zh: '接球就投' },
          description: {
            en: 'Shooting immediately after receiving a pass, maximizing the lack of defensive contest.',
            zh: '接到传球后立即出手，最大化利用防守空隙。'
          },
          steps: {
            en: ['Have hands ready ("show target").', 'Step into the shot (1-2 step or hop).', 'Use the pass momentum for lift.'],
            zh: ['双手做好接球准备（亮出靶子）。', '脚步调整接球（1-2步或跳步）。', '借用传球的力量起跳。']
          },
          mistakes: {
            en: ['Dipping the ball too low (wasting time).', 'Feet not set before catching.'],
            zh: ['接球后下沉球太低（浪费时间）。', '接球前脚步未到位。']
          }
        },
        {
          id: 'pull_up',
          label: { en: 'Pull-up Jumper', zh: '急停跳投' },
          description: {
            en: 'Transitioning from a dribble drive into a vertical jump shot.',
            zh: '从运球突破状态瞬间转换为垂直起跳投篮。'
          },
          steps: {
            en: ['Hard final dribble.', 'Plant feet quickly to break momentum.', 'Jump straight up, not forward.', 'High release.'],
            zh: ['最后一次运球要用力。', '快速制动脚步。', '垂直起跳，不要向前冲。', '高出手点。']
          },
          mistakes: {
            en: ['Drifting forward.', 'Slow transition from dribble to shot.'],
            zh: ['身体前冲。', '运球转投篮动作太慢。']
          }
        },
        {
          id: 'free_throw',
          label: { en: 'Free Throw', zh: '罚球' },
          description: {
            en: 'Uncontested shot from the foul line. Consistency and routine are key.',
            zh: '罚球线上的无人防守投篮。一致性和固定流程是关键。'
          },
          steps: {
            en: ['Establish a consistent pre-shot routine.', 'Deep breath to relax.', 'Bend knees, up and out motion.', 'Hold follow through.'],
            zh: ['建立固定的罚球前准备动作。', '深呼吸放松。', '屈膝，向上向前的连贯动作。', '保持出手跟随动作。']
          },
          mistakes: {
            en: ['Rushing the routine.', 'Stepping over the line.', 'Tense shoulders.'],
            zh: ['准备动作仓促。', '踩线。', '肩膀过分紧张。']
          }
        }
      ]
    },
    {
      id: 'dribbling',
      label: { en: 'Dribbling', zh: '运球控球' },
      skills: [
        {
          id: 'ball_familiarity',
          label: { en: 'Ball Familiarity', zh: '球性熟悉 (Ball Familiarity)' },
          description: {
            en: 'Essential rookie drills to get comfortable with the ball before dribbling.',
            zh: '初学者在运球前适应球感的必要练习。'
          },
          steps: {
            en: ['Ball Slaps: Slap the ball hard to wake up hands.', 'Body Wraps: Move ball around head, waist, and knees without dropping.', 'Finger Taps: Tap ball rapidly between fingertips with straight arms.'],
            zh: ['大力拍球：用力拍打球以唤醒手部神经。', '身体绕球：环绕头、腰、膝盖转球，不掉球。', '指尖拨球：手臂伸直，用指尖快速来回拨球。']
          },
          mistakes: {
            en: ['Using palms instead of fingertips.', 'Looking down at the ball.', 'Moving too slowly.'],
            zh: ['用手掌而不是指尖。', '低头看球。', '动作太慢。']
          }
        },
        {
          id: 'speed_dribble',
          label: { en: 'Speed Dribble', zh: '推进运球 (Speed Dribble)' },
          description: {
            en: 'Dribbling while running to advance the ball up the court quickly.',
            zh: '在奔跑中运球，用于快速推进过半场。'
          },
          steps: {
            en: ['Push the ball out in front of you.', 'Dribble waist to chest high.', 'Run naturally behind the ball.', 'Keep head up.'],
            zh: ['将球推向身体前方。', '运球高度在腰部到胸部之间。', '在球后方自然奔跑。', '保持抬头。']
          },
          mistakes: {
            en: ['Dribbling too close to feet (tripping).', 'Dribbling too high (losing control).'],
            zh: ['运球离脚太近（绊倒）。', '运球太高（失控）。']
          }
        },
        {
          id: 'crossover',
          label: { en: 'Crossover', zh: '变向 (Crossover)' },
          description: {
            en: 'Switching the ball quickly from one hand to another to shift the defender.',
            zh: '快速将球从一只手换到另一只手，以晃动防守人重心。'
          },
          steps: {
            en: ['Plant outside foot hard.', 'Keep ball low, below knees.', 'Snap wrist quickly across body.', 'Explode in opposite direction.'],
            zh: ['外侧脚用力蹬地。', '保持低运球，膝盖以下。', '手腕快速发力将球拍向对侧。', '向相反方向爆发启动。']
          },
          mistakes: {
            en: ['Dribbling too high.', 'Not selling the fake with head/shoulders.', 'Lazy footwork.'],
            zh: ['运球太高。', '头/肩没有假动作配合。', '脚步懒散。']
          }
        },
        {
          id: 'between_legs',
          label: { en: 'Between Legs', zh: '胯下运球' },
          description: {
            en: 'Dribbling between legs to protect the ball while changing direction or pace.',
            zh: '在双腿之间运球，在变向或变速时保护球。'
          },
          steps: {
            en: ['Drop hips low.', 'Step forward with opposite foot.', 'Push ball through legs decisively.'],
            zh: ['降低重心。', '对侧脚向前迈出。', '果断将球拍过胯下。']
          },
          mistakes: {
            en: ['Looking down.', 'Hitting inner thigh with ball.'],
            zh: ['低头。', '球砸到大腿内侧。']
          }
        },
        {
          id: 'in_n_out',
          label: { en: 'In & Out', zh: '内外运球' },
          description: {
            en: 'Fake crossover to freeze defender, then continuing in same direction.',
            zh: '假装变向以冻结防守者，然后继续向同一方向突破。'
          },
          steps: {
            en: ['Push ball inside as if to cross.', 'Rotate hand over top of ball.', 'Pull back outside quickly.'],
            zh: ['将球向内推，假装变向。', '手在球上方旋转。', '快速将球拉回外侧。']
          },
          mistakes: {
            en: ['Carrying the ball (hand under ball).', 'No body feint.'],
            zh: ['翻腕（手心向上）。', '没有身体晃动。']
          }
        },
        {
          id: 'behind_back',
          label: { en: 'Behind the Back', zh: '背后运球' },
          description: {
            en: 'Protects the ball from a defender reaching in while changing direction.',
            zh: '在变向时保护球不被防守人掏掉。'
          },
          steps: {
            en: ['Wrap the ball around your waist level.', 'Snap wrist to push ball to other hand.', 'Keep eyes up.'],
            zh: ['将球环绕腰部水平位置。', '手腕发力将球推向另一只手。', '保持抬头观察。']
          },
          mistakes: {
            en: ['Hitting own heels.', 'Looking down at the ball.'],
            zh: ['运球砸到脚后跟。', '低头看球。']
          }
        }
      ]
    },
    {
      id: 'footwork',
      label: { en: 'Footwork', zh: '脚步技术' },
      skills: [
         {
          id: 'jump_stop',
          label: { en: 'Jump Stop', zh: '急停 (Jump Stop)' },
          description: {
            en: 'A controlled two-foot landing to stop momentum without traveling. Crucial for rookies.',
            zh: '受控的双脚同时着地，在不走步的情况下停止冲刺。初学者必备。'
          },
          steps: {
            en: ['Run/Dribble forward.', 'Hop slightly and land on BOTH feet simultaneously.', 'Knees bent, butt down (Chair sit).', 'Protect ball (Chin it).'],
            zh: ['向前跑动/运球。', '轻微跳起，双脚**同时**着地。', '屈膝，臀部下沉（坐椅子）。', '护球（收至下巴）。']
          },
          mistakes: {
            en: ['Landing 1-2 (Travel risk).', 'Leaning forward (Off balance).', 'Straight legs (Injury risk).'],
            zh: ['双脚先后着地（易走步）。', '身体前倾（失去平衡）。', '膝盖直立（受伤风险）。']
          }
        },
        {
          id: 'pivoting',
          label: { en: 'Pivoting', zh: '转身/轴心脚 (Pivoting)' },
          description: {
            en: 'Rotating on one foot (pivot foot) to protect the ball or create space without traveling.',
            zh: '以一只脚（轴心脚）为轴旋转，在不走步的情况下保护球或创造空间。'
          },
          steps: {
            en: ['Keep pivot foot GLUED to the floor.', 'Step with the other foot.', 'Stay low.', 'Front Pivot: Step forward. Reverse Pivot: Drop step backward.'],
            zh: ['轴心脚像钉子一样钉在地上。', '移动另一只脚。', '保持低重心。', '前转身：向前迈步。后转身：向后撤步。']
          },
          mistakes: {
            en: ['Lifting the pivot foot (Travel).', 'Standing up tall.', 'Exposing the ball.'],
            zh: ['抬起轴心脚（走步）。', '站得太直。', '暴露球的位置。']
          }
        },
        {
          id: 'triple_threat',
          label: { en: 'Triple Threat', zh: '三威胁' },
          description: {
            en: 'Position from which you can shoot, pass, or dribble. Critical for wing players.',
            zh: '可以投篮、传球或运球的姿势。侧翼球员必备。'
          },
          steps: {
            en: ['Catch ball and face basket.', 'Knees bent, ball in shooting pocket.', 'Pivot foot established.'],
            zh: ['接球并面向篮筐。', '屈膝，球放在投篮准备区。', '确立中轴脚。']
          },
          mistakes: {
            en: ['Standing straight up.', 'Ball too high or unprotected.'],
            zh: ['直立站姿。', '球太高或未受保护。']
          }
        },
        {
          id: 'jab_step',
          label: { en: 'Jab Step', zh: '试探步' },
          description: {
            en: 'Short, sharp step to test or back off the defender.',
            zh: '短促有力的步伐，用于试探或逼退防守者。'
          },
          steps: {
            en: ['Keep pivot foot planted.', 'Step hard directly at defender or to side.', 'Keep ball protected.'],
            zh: ['中轴脚不动。', '向防守者或侧面用力踏出。', '保护好球。']
          },
          mistakes: {
            en: ['Lifting pivot foot (travel).', 'Over-extending (losing balance).'],
            zh: ['抬起中轴脚（走步）。', '步幅过大（失去平衡）。']
          }
        }
      ]
    },
    {
      id: 'passing',
      label: { en: 'Passing', zh: '传球' },
      skills: [
        {
          id: 'chest_pass',
          label: { en: 'Chest Pass', zh: '胸前传球' },
          description: {
            en: 'Direct pass from chest to chest. Fastest way to move the ball.',
            zh: '从胸前到胸前的直接传球。最快的转移球方式。'
          },
          steps: {
            en: ['Thumbs behind ball.', 'Step into the pass.', 'Push arms out, thumbs down finish.'],
            zh: ['拇指在球后。', '迈步传球。', '双臂推出，拇指向下结束。']
          },
          mistakes: {
            en: ['Elbows flying out.', 'No power from legs.'],
            zh: ['肘部外翻。', '腿部没发力。']
          }
        },
        {
          id: 'bounce_pass',
          label: { en: 'Bounce Pass', zh: '击地传球' },
          description: {
            en: 'Pass that hits the floor 2/3 of the way to the receiver. Good for tight spaces.',
            zh: '球在距离接球者 2/3 处反弹的传球。适合狭小空间。'
          },
          steps: {
            en: ['Target spot on floor.', 'Step and push decisively.', 'Stay low.'],
            zh: ['瞄准地板上的点。', '迈步并果断推出。', '保持低姿态。']
          },
          mistakes: {
            en: ['Bouncing too close to thrower.', 'Not stepping into pass.'],
            zh: ['击地点离传球人太近。', '传球时未向前迈步。']
          }
        },
        {
          id: 'overhead_pass',
          label: { en: 'Overhead Pass', zh: '头上传球' },
          description: {
            en: 'Passing from above the forehead. Useful for passing over defenders or long outlets.',
            zh: '从额头上方传球。适用于越过防守者或长传快攻。'
          },
          steps: {
            en: ['Ball held above forehead (not behind head).', 'Step forward.', 'Snap wrists and fingers forward.'],
            zh: ['球举在额头上方（不要放到脑后）。', '向前迈步。', '手腕和手指用力向前甩出。']
          },
          mistakes: {
            en: ['Bringing ball behind head (takes too long, easy steal).', 'Crossing feet.'],
            zh: ['把球放到脑后（太慢，容易被断）。', '脚步交叉。']
          }
        }
      ]
    },
    {
      id: 'finishing',
      label: { en: 'Finishing', zh: '终结技术' },
      skills: [
        {
          id: 'layup',
          label: { en: 'Layup', zh: '上篮' },
          description: {
            en: 'High percentage shot near the rim, usually off the backboard.',
            zh: '篮下高命中率得分手段，通常利用篮板。'
          },
          steps: {
            en: ['Protect the ball.', 'Jump off inside foot, shoot with outside hand.', 'Aim for the top corner of the small box.'],
            zh: ['保护球。', '内侧脚起跳，外侧手出手。', '瞄准篮板小方框的上角。']
          },
          mistakes: {
            en: ['Jumping forward instead of up.', 'Not using the backboard.'],
            zh: ['向前冲跳而不是向上跳。', '不使用擦板。']
          }
        },
        {
          id: 'floater',
          label: { en: 'Floater', zh: '抛投' },
          description: {
            en: 'High-arcing shot to score over tall defenders without getting too close.',
            zh: '高弧度投篮，用于在不靠近高大防守者的情况下得分。'
          },
          steps: {
            en: ['Jump off one or two feet.', 'Release ball high.', 'Soft touch, no follow through needed.'],
            zh: ['单脚或双脚起跳。', '高点出手。', '手感柔和，不需要完整的压腕跟随。']
          },
          mistakes: {
            en: ['Shooting too hard (brick).', 'Low release point.'],
            zh: ['力量太大。', '出手点太低。']
          }
        },
        {
          id: 'euro_step',
          label: { en: 'Euro Step', zh: '欧洲步' },
          description: {
            en: 'Deceptive move involving lateral steps to evade a defender.',
            zh: '通过左右大幅度横移来避开防守者的欺骗性步法。'
          },
          steps: {
            en: ['Fake one direction with first step.', 'Bring ball high or low across body.', 'Step hard in opposite direction for finish.'],
            zh: ['第一步向一侧做假动作。', '将球从高处或低处横移保护。', '第二步向反方向大幅跨出终结。']
          },
          mistakes: {
            en: ['Moving too slow.', 'Exposing the ball to the defender.'],
            zh: ['动作太慢。', '球暴露给防守者。']
          }
        }
      ]
    },
    {
      id: 'defense',
      label: { en: 'Defense', zh: '防守' },
      skills: [
        {
          id: 'stance',
          label: { en: 'Defensive Stance', zh: '防守站位' },
          description: {
            en: 'The foundation of all defense. Wide base, low center of gravity.',
            zh: '所有防守的基础。宽基底，低重心。'
          },
          steps: {
            en: ['Feet wider than shoulders.', 'Hips low (squat position).', 'Hands active (one high, one low).', 'Weight on balls of feet.'],
            zh: ['双脚宽于肩。', '臀部放低（深蹲姿态）。', '双手活跃（一高一低）。', '重心在前脚掌。']
          },
          mistakes: {
            en: ['Standing too straight.', 'Crossing feet when sliding.', 'Reaching excessively.'],
            zh: ['站得太直。', '滑步时双脚交叉。', '过度伸手掏球。']
          }
        },
        {
          id: 'closeout',
          label: { en: 'Closeout', zh: '扑防 (Closeout)' },
          description: {
            en: 'Sprinting to a shooter and breaking down to contain the drive.',
            zh: '冲向投篮者并减速碎步以防止突破。'
          },
          steps: {
            en: ['Sprint 2/3 of the way.', 'Choppy steps (stutter) last 1/3.', 'Hand up to contest.', 'Hips low.'],
            zh: ['前2/3路程冲刺。', '后1/3路程碎步减速。', '举手干扰。', '降低重心。']
          },
          mistakes: {
            en: ['Running past the offensive player.', 'Jumping too early (fake).'],
            zh: ['冲过头。', '起跳太早（吃晃）。']
          }
        },
        {
          id: 'box_out',
          label: { en: 'Box Out', zh: '卡位抢板' },
          description: {
            en: 'Sealing the opponent out of the rebounding area.',
            zh: '将对手挡在篮板区域之外。'
          },
          steps: {
            en: ['Locate opponent.', 'Make contact (forearm/body).', 'Turn and seal with backside.', 'Go get the ball.'],
            zh: ['寻找对手位置。', '身体接触（前臂/身体）。', '转身用背部顶住。', '起跳抓球。']
          },
          mistakes: {
            en: ['Watching the ball only.', 'Not holding the seal.'],
            zh: ['只盯着球看。', '没有保持住卡位。']
          }
        }
      ]
    }
  ],
  [SkillCategory.PHYSICAL]: [
    {
      id: 'strength',
      label: { en: 'Strength Training', zh: '力量训练' },
      skills: [
        {
          id: 'lower_body',
          label: { en: 'Lower Body (Squat)', zh: '下肢力量 (深蹲)' },
          description: {
            en: 'Builds leg drive essential for jumping and defensive stances.',
            zh: '建立弹跳和防守站位所必需的腿部驱动力。'
          },
          steps: {
            en: ['Feet shoulder-width apart.', 'Keep chest up and back straight.', 'Lower hips until parallel.', 'Drive up through heels.'],
            zh: ['双脚与肩同宽。', '挺胸收腹背部挺直。', '下蹲至大腿平行地面。', '脚后跟发力站起。']
          },
          mistakes: {
            en: ['Knees caving inward (valgus).', 'Heels lifting off ground.', 'Rounding the back.'],
            zh: ['膝盖内扣。', '脚后跟离地。', '弯腰驼背。']
          }
        },
        {
          id: 'core',
          label: { en: 'Core Stability', zh: '核心稳定性' },
          description: {
            en: 'Essential for absorbing contact and maintaining balance in air.',
            zh: '对抗中吸收冲击和保持空中平衡的关键。'
          },
          steps: {
            en: ['Planks (front/side) - 30s to 1min.', 'Dead Bugs - control limb movement.', 'Russian Twists - rotational power.'],
            zh: ['平板支撑（正面/侧面） - 30秒至1分钟。', '死虫式 - 控制四肢运动。', '俄罗斯转体 - 旋转力量。']
          },
          mistakes: {
            en: ['Sagging hips in plank.', 'Holding breath.', 'Rushing repetitions.'],
            zh: ['平板支撑塌腰。', '憋气。', '动作过快。']
          }
        },
        {
          id: 'upper_push',
          label: { en: 'Upper Body (Push)', zh: '上肢力量 (推)' },
          description: {
            en: 'Upper body strength for passing power and fighting through screens.',
            zh: '用于传球力度和挤过掩护的上肢力量。'
          },
          steps: {
            en: ['Push-ups / Bench Press.', 'Keep elbows at 45 degree angle.', 'Full range of motion.'],
            zh: ['俯卧撑 / 卧推。', '手肘保持45度角。', '全程动作。']
          },
          mistakes: {
            en: ['Flaring elbows out (shoulder risk).', 'Partial reps.'],
            zh: ['手肘过度外张（肩部风险）。', '半程动作。']
          }
        }
      ]
    },
    {
      id: 'plyometrics',
      label: { en: 'Power & Plyometrics', zh: '爆发力训练' },
      skills: [
        {
          id: 'vertical_jump',
          label: { en: 'Vertical Jump (Box)', zh: '垂直弹跳 (跳箱)' },
          description: {
            en: 'Explosive vertical power for rebounding and finishing.',
            zh: '抢篮板和终结所需的垂直爆发力。'
          },
          steps: {
            en: ['Stand in athletic stance.', 'Swing arms back deeply.', 'Explode up onto box.', 'Land softly (quietly).'],
            zh: ['运动站姿准备。', '手臂大幅后摆。', '爆发力跳上箱子。', '轻柔落地（无声）。']
          },
          mistakes: {
            en: ['Landing with stiff legs.', 'Box too high (compromising form).'],
            zh: ['直腿落地（伤膝盖）。', '箱子太高（动作变形）。']
          }
        },
        {
          id: 'depth_jump',
          label: { en: 'Depth Jump', zh: '深跳 (超等长收缩)' },
          description: {
            en: 'Advanced plyometric drill using gravity to increase reactive power.',
            zh: '利用重力增加反应性力量的高级爆发力训练。'
          },
          steps: {
            en: ['Step off a low box.', 'Land on balls of feet.', 'Immediately jump vertically as high as possible.'],
            zh: ['从低箱走下（不是跳下）。', '前脚掌着地。', '触地即刻全力向上跳起。']
          },
          mistakes: {
            en: ['Spending too much time on ground.', 'Heels hitting hard.'],
            zh: ['触地时间过长。', '脚后跟重重着地。']
          }
        }
      ]
    },
    {
      id: 'speed_agility',
      label: { en: 'Speed & Agility', zh: '速度与敏捷' },
      skills: [
        {
          id: 'defensive_slide',
          label: { en: 'Defensive Slide', zh: '防守滑步' },
          description: {
            en: 'Lateral movement conditioning to stay in front of ball handler.',
            zh: '保持在持球人身前的横向移动体能。'
          },
          steps: {
            en: ['Push off the back foot.', 'Step with lead foot.', 'Keep wide base.', 'Do not cross feet.'],
            zh: ['后脚蹬地。', '前脚迈出。', '保持宽基底。', '不要交叉双脚。']
          },
          mistakes: {
            en: ['Bobbing up and down.', 'Clicking heels together.'],
            zh: ['身体上下起伏。', '脚后跟相撞。']
          }
        },
        {
          id: 'suicides',
          label: { en: 'Line Drills', zh: '折返跑 (自杀跑)' },
          description: {
             en: 'Sprinting drills for acceleration and deceleration.',
             zh: '加速与减速冲刺训练。'
          },
          steps: {
            en: ['Touch baseline.', 'Sprint to free throw, touch, back.', 'Sprint to half court, touch, back.', 'Full court.'],
            zh: ['摸底线。', '冲刺至罚球线，摸地返回。', '冲刺至中线，摸地返回。', '全场往返。']
          },
          mistakes: {
            en: ['Not touching the line.', 'Slow turns (rounded turns).'],
            zh: ['没有摸到线。', '转身太慢（绕大圈）。']
          }
        }
      ]
    },
    {
      id: 'endurance',
      label: { en: 'Endurance', zh: '耐力训练' },
      skills: [
        {
          id: 'hiit',
          label: { en: 'HIIT (Intervals)', zh: '高强度间歇 (HIIT)' },
          description: {
            en: 'Mimics the stop-and-go nature of basketball games.',
            zh: '模拟篮球比赛急停急起的体能特性。'
          },
          steps: {
            en: ['Sprint 30 seconds.', 'Walk/Rest 30 seconds.', 'Repeat 10-15 times.'],
            zh: ['冲刺30秒。', '走动休息30秒。', '重复10-15次。']
          },
          mistakes: {
            en: ['Pacing yourself (go 100% on sprint).', 'Sitting down during rest.'],
            zh: ['配速保留体力（冲刺应全力）。', '休息时坐下。']
          }
        },
        {
          id: 'steady_state',
          label: { en: 'Aerobic Base', zh: '有氧基础' },
          description: {
            en: 'Low intensity running to build heart health and recovery capacity.',
            zh: '低强度跑步，建立心脏健康和恢复能力。'
          },
          steps: {
            en: ['Jog at conversational pace.', '20-30 minutes duration.', 'Focus on breathing.'],
            zh: ['以能对话的速度慢跑。', '持续20-30分钟。', '专注于呼吸节奏。']
          },
          mistakes: {
            en: ['Running too fast.', 'Bad posture.'],
            zh: ['跑得太快。', '姿势不良。']
          }
        }
      ]
    },
    {
      id: 'coordination',
      label: { en: 'Coordination & Balance', zh: '协调与平衡' },
      skills: [
        {
          id: 'jump_rope',
          label: { en: 'Jump Rope', zh: '跳绳' },
          description: {
            en: 'Improves foot speed, rhythm, and ankle stiffness.',
            zh: '提高脚部速度、节奏感和踝关节刚性。'
          },
          steps: {
            en: ['Keep elbows tucked.', 'Use wrists to spin rope.', 'Small jumps on balls of feet.'],
            zh: ['手肘夹紧。', '用手腕转动绳子。', '前脚掌小幅跳跃。']
          },
          mistakes: {
            en: ['Jumping too high (donkey kick).', 'Using whole arm to swing.'],
            zh: ['跳得太高（像驴踢腿）。', '用整个手臂甩绳。']
          }
        },
        {
          id: 'single_leg',
          label: { en: 'Single Leg Balance', zh: '单腿平衡' },
          description: {
            en: 'Strengthens stabilizers to prevent ankle rolls.',
            zh: '增强稳定肌群，预防崴脚。'
          },
          steps: {
            en: ['Stand on one leg.', 'Knee slightly bent.', 'Hold for 30s.', 'Progression: Close eyes.'],
            zh: ['单腿站立。', '膝盖微屈。', '保持30秒。', '进阶：闭眼。']
          },
          mistakes: {
            en: ['Locked knee.', 'Flailing arms wildly.'],
            zh: ['膝盖锁死。', '手臂乱挥。']
          }
        }
      ]
    },
    {
      id: 'recovery',
      label: { en: 'Recovery & Mobility', zh: '恢复与灵活性' },
      skills: [
        {
          id: 'dynamic_stretch',
          label: { en: 'Dynamic Stretching', zh: '动态拉伸 (热身)' },
          description: {
            en: 'Moving while stretching to prepare muscles for action.',
            zh: '在运动中拉伸，为肌肉活动做准备。'
          },
          steps: {
            en: ['High Knees.', 'Butt Kicks.', 'Leg Swings.', 'Lunge with Twist.'],
            zh: ['高抬腿。', '后踢腿。', '摆腿。', '箭步蹲转体。']
          },
          mistakes: {
            en: ['Static holding (save for after).', 'Cold muscles (do light jog first).'],
            zh: ['静态保持（留到练后）。', '肌肉冷的时候做（先慢跑）。']
          }
        },
        {
          id: 'foam_rolling',
          label: { en: 'Foam Rolling', zh: '泡沫轴放松' },
          description: {
            en: 'Self-myofascial release to reduce soreness.',
            zh: '自我筋膜放松，减少酸痛。'
          },
          steps: {
            en: ['Roll quads, calves, and IT band.', 'Spend 30s on tight spots.', 'Breathe deeply.'],
            zh: ['滚动大腿前侧、小腿和髂胫束。', '在紧绷点停留30秒。', '深呼吸。']
          },
          mistakes: {
            en: ['Rolling too fast.', 'Rolling directly on joints/bones.'],
            zh: ['滚动太快。', '直接滚压关节或骨头。']
          }
        }
      ]
    }
  ]
};

export const TRANSLATIONS = {
  en: {
    appTitle: "Gemini Courtside AI",
    nav: {
      aiCoach: "AI Coach",
      skills: "Skills",
      tactics: "Tactics",
      league: "League Manager",
      school: "School Manager",
      training: "Training"
    },
    home: {
      welcome: "Welcome to",
      subtitle: "Your professional AI basketball companion. Master skills, analyze tactics, and dominate the league with personalized insights.",
      startTraining: "Start Training"
    },
    skills: {
      title: "Skill Library",
      technical: "Technical",
      physical: "Physical",
      initialPrompt: "I can help you master **{category}** skills. Select a specific skill on the left to see details, or ask me directly here.",
      context: "User is viewing the skill: {skill}. Help them with tips, drills, or corrections.",
      selectPrompt: "Select a skill category to view detailed breakdown.",
      tabs: {
        guide: "Visual Guide",
        steps: "Action Steps",
        mistakes: "Common Mistakes"
      }
    },
    tactics: {
      title: "Tactical Board",
      preset: "Tactics Library",
      analysisTitle: "AI Analysis",
      placeholder: "Select a tactic to see AI breakdown (Purpose, Execution, Counters) and Animation.",
      analyzing: "Analyzing...",
      animation: {
        play: "Play",
        pause: "Pause",
        reset: "Reset",
        step: "Step"
      }
    },
    league: {
      title: "League Management",
      createLeague: "Create League",
      createTeam: "Add Team",
      createPlayer: "Add Player",
      leagueName: "League Name",
      season: "Season",
      teamName: "Team Name",
      playerName: "Player Name",
      stats: "Stats",
      noLeagues: "No leagues created. Start by creating one.",
      noTeams: "No teams in this league.",
      noPlayers: "No players in this team.",
      scoutReport: "AI Scout Report",
      generateScout: "Generate Scout Report",
      positions: {
        G: "Guard",
        F: "Forward",
        C: "Center"
      },
      tabs: {
        teams: "Teams",
        matches: "Matches"
      },
      match: {
        create: "Schedule Match",
        vs: "VS",
        start: "Start Game",
        resume: "Resume",
        finish: "Finish",
        home: "Home",
        away: "Away",
        noMatches: "No matches scheduled.",
        status: {
          scheduled: "Scheduled",
          live: "Live",
          final: "Final"
        }
      },
      live: {
        title: "Live Game Tracker",
        scoreboard: "Scoreboard",
        actions: "Quick Actions",
        addPts: "+ Pts",
        addReb: "+ Reb",
        addAst: "+ Ast",
        fouls: "Fouls",
        undo: "Undo"
      }
    },
    school: {
      title: "School Management",
      createSchool: "Add School",
      createGrade: "Add Grade",
      createClass: "Add Class",
      createStudent: "Add Student",
      schoolName: "School Name",
      region: "Region/District",
      gradeName: "Enrollment Year (Grade)",
      className: "Class Name",
      grade: "Grade",
      studentName: "Student Name",
      parentName: "Parent/Dad's Name",
      parentPhone: "Parent Phone",
      noSchools: "No schools added yet.",
      noGrades: "No grades/years added.",
      noClasses: "No classes in this grade.",
      noStudents: "No students in this class.",
      age: "Age",
      height: "Height",
      dadsCupReady: "Dad's Cup Ready"
    },
    training: {
      title: "Plan Generator",
      duration: "Duration",
      level: "Level",
      focus: "Focus",
      age: "Age",
      generateButton: "Generate Plan",
      generatingButton: "Generating...",
      emptyState: "Configure your needs and let AI generate a pro-level training schedule.",
      daysOptions: {
        "1": "1 Day (Quick Session)",
        "7": "7 Days (Week)",
        "30": "30 Days (Month)"
      },
      levelOptions: {
        "Beginner": "Beginner",
        "Intermediate": "Intermediate",
        "Advanced": "Advanced / Pro"
      },
      savedPlans: "Saved Plans",
      saveButton: "Save Plan",
      deleteButton: "Delete",
      noSaved: "No saved plans yet."
    },
    chat: {
      placeholder: "Ask Coach...",
      initial: "I'm Coach Gemini. Ask me anything about skills, tactics, or training."
    },
    common: {
      footer: "Powered by Gemini 2.5 Flash",
      reset: "Reset Board",
      clickToMove: "Click anywhere to move player",
      clickToSelect: "Click player to select",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      back: "Back"
    }
  },
  zh: {
    appTitle: "Gemini 场边 AI",
    nav: {
      aiCoach: "AI 教练",
      skills: "篮球技术",
      tactics: "战术板",
      league: "联赛管理",
      school: "校园管理",
      training: "训练计划"
    },
    home: {
      welcome: "欢迎来到",
      subtitle: "您的专业 AI 篮球伙伴。掌握技术，分析战术，通过个性化洞察统治赛场。",
      startTraining: "开始训练"
    },
    skills: {
      title: "技术库",
      technical: "篮球技术",
      physical: "身体能力",
      initialPrompt: "我可以帮助您掌握 **{category}**。在左侧选择具体技能查看详情，或直接在此提问。",
      context: "用户正在查看技能：{skill}。请提供技巧、训练方法或纠正建议。",
      selectPrompt: "选择一个技能分类查看详细分解。",
      tabs: {
        guide: "视觉演示",
        steps: "动作步骤",
        mistakes: "常见错误"
      }
    },
    tactics: {
      title: "战术板",
      preset: "战术库",
      analysisTitle: "AI 分析",
      placeholder: "选择一个战术以查看 AI 解析（用途、执行、反制）及战术动画。",
      analyzing: "分析中...",
      animation: {
        play: "播放",
        pause: "暂停",
        reset: "重置",
        step: "步骤"
      }
    },
    league: {
      title: "联赛管理",
      createLeague: "创建联赛",
      createTeam: "添加球队",
      createPlayer: "添加球员",
      leagueName: "联赛名称",
      season: "赛季",
      teamName: "球队名称",
      playerName: "球员姓名",
      stats: "数据",
      noLeagues: "暂无联赛。请先创建一个。",
      noTeams: "该联赛暂无球队。",
      noPlayers: "该球队暂无球员。",
      scoutReport: "AI 球探报告",
      generateScout: "生成球探报告",
      positions: {
        G: "后卫",
        F: "前锋",
        C: "中锋"
      },
      tabs: {
        teams: "球队列表",
        matches: "比赛日程"
      },
      match: {
        create: "安排比赛",
        vs: "VS",
        start: "开始比赛",
        resume: "继续记录",
        finish: "结束比赛",
        home: "主队",
        away: "客队",
        noMatches: "暂无比赛安排。",
        status: {
          scheduled: "未开始",
          live: "进行中",
          final: "已结束"
        }
      },
      live: {
        title: "实时数据记录器",
        scoreboard: "计分板",
        actions: "快捷记录",
        addPts: "+ 得分",
        addReb: "+ 篮板",
        addAst: "+ 助攻",
        fouls: "犯规",
        undo: "撤销"
      }
    },
    school: {
      title: "校园管理",
      createSchool: "添加学校",
      createGrade: "添加年级",
      createClass: "添加班级",
      createStudent: "添加学生",
      schoolName: "学校名称",
      region: "区域/行政区",
      gradeName: "入学年份 (年级)",
      className: "班级名称",
      grade: "年级",
      studentName: "学生姓名",
      parentName: "家长/父亲姓名",
      parentPhone: "家长电话",
      noSchools: "暂无学校信息，请先添加。",
      noGrades: "该校暂无年级信息。",
      noClasses: "该年级暂无班级。",
      noStudents: "该班级暂无学生。",
      age: "年龄",
      height: "身高",
      dadsCupReady: "爸爸杯报名信息已备"
    },
    training: {
      title: "计划生成器",
      duration: "时长",
      level: "水平",
      focus: "重点",
      age: "年龄",
      generateButton: "生成计划",
      generatingButton: "生成中...",
      emptyState: "配置您的需求，让 AI 生成职业级训练计划。",
      daysOptions: {
        "1": "1 天 (快速训练)",
        "7": "7 天 (周计划)",
        "30": "30 天 (月计划)"
      },
      levelOptions: {
        "Beginner": "初级",
        "Intermediate": "中级",
        "Advanced": "高级 / 职业"
      },
      savedPlans: "已保存计划",
      saveButton: "保存计划",
      deleteButton: "删除",
      noSaved: "暂无保存的计划。"
    },
    chat: {
      placeholder: "咨询教练...",
      initial: "我是 Gemini 教练。请随时问我关于技术、战术或训练的问题。"
    },
    common: {
      footer: "由 Gemini 2.5 Flash 驱动",
      reset: "重置画板",
      clickToMove: "点击任意位置移动球员",
      clickToSelect: "点击球员选中",
      save: "保存",
      cancel: "取消",
      delete: "删除",
      back: "返回"
    }
  }
};
