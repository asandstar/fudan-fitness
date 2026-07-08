'use client';

// 详细器材指南页 — 纯CSS渐变+图标，无外部图片依赖
import {
  Dumbbell, Activity, StretchHorizontal, TrendingUp,
  ExternalLink, Shield, Clock, Target,
  Heart, AlertCircle, Lightbulb, BookOpen,
} from 'lucide-react';

const EQUIPMENT_CATEGORIES = [
  {
    id: 'strength',
    icon: Dumbbell,
    title: '力量器械区',
    subtitle: '增肌与力量训练',
    gradientClass: 'equipment-gradient-strength',
    description: '力量器械区配备了完整的综合训练设备,适合增肌、力量提升和塑形训练。建议初学者从固定器械开始,逐步过渡到自由重量。',
    source: 'ACSM运动指南',
  },
  {
    id: 'cardio',
    icon: Activity,
    title: '有氧训练区',
    subtitle: '减脂与心肺提升',
    gradientClass: 'equipment-gradient-cardio',
    description: '有氧训练区提供多种心肺训练设备,帮助提升心肺功能和减脂。建议每周进行3-5次中等强度有氧运动。',
    source: 'WHO健康指南',
  },
  {
    id: 'stretching',
    icon: StretchHorizontal,
    title: '拉伸放松区',
    subtitle: '柔韧性与恢复',
    gradientClass: 'equipment-gradient-stretch',
    description: '拉伸放松区是训练前后必不可少的区域,配备专业的放松恢复设备,帮助预防受伤和加速恢复。',
    source: 'NSCA训练指南',
  },
  {
    id: 'freeweight',
    icon: TrendingUp,
    title: '自由重量区',
    subtitle: '进阶力量训练',
    gradientClass: 'equipment-gradient-freeweight',
    description: '自由重量区是进阶训练者的核心区域,配备专业的力量训练设备。使用前请确保掌握标准动作。',
    source: '美国力量与体能协会',
  },
];

const STRENGTH_EQUIPMENTS = [
  {
    name: '哑铃',
    description: '最基础也是最有效的力量训练工具,适合全身各部位训练',
    usage: '站姿或坐姿进行弯举、侧平举、肩推、卧推、深蹲等多种动作',
    tips: '选择合适重量,建议每组8-12次,完成3-4组',
    safety: '训练时注意保持核心稳定,避免耸肩',
    weightRange: '2-30kg',
    setsReps: '3-4组 x 8-12次',
    targetMuscles: '全身肌群',
    difficulty: '新手',
  },
  {
    name: '杠铃',
    description: '力量训练的核心工具,能最大化刺激肌肉生长',
    usage: '进行深蹲、卧推、硬拉、站姿推举等复合动作',
    tips: '建议在有经验的教练指导下开始使用',
    safety: '使用时确保有保护者在场,注意动作规范',
    weightRange: '空杆20kg起',
    setsReps: '3-5组 x 5-8次',
    targetMuscles: '全身复合肌群',
    difficulty: '进阶',
  },
  {
    name: '龙门架/绳索训练器',
    description: '多功能训练设备,可进行多种孤立和复合动作',
    usage: '下拉、划船、夹胸、弯举、侧平举等多种动作',
    tips: '调整滑轮高度可以改变训练角度和难度',
    safety: '使用前检查绳索和滑轮是否正常',
    weightRange: '插片式可调',
    setsReps: '3组 x 10-15次',
    targetMuscles: '胸、背、肩、手臂',
    difficulty: '新手',
  },
  {
    name: '高位下拉机',
    description: '专门针对背部训练的固定器械',
    usage: '坐姿进行宽握或窄握下拉训练背阔肌',
    tips: '下拉时感受背部发力,避免手臂代偿',
    safety: '调整座椅高度,确保膝盖固定',
    weightRange: '插片式可调',
    setsReps: '3-4组 x 10-12次',
    targetMuscles: '背阔肌、斜方肌',
    difficulty: '新手',
  },
  {
    name: '坐姿推举机',
    description: '针对肩部和胸部训练的固定器械',
    usage: '坐姿进行肩部推举或胸部推举',
    tips: '推举时保持背部挺直,不要后仰借力',
    safety: '选择合适重量,避免耸肩',
    weightRange: '插片式可调',
    setsReps: '3组 x 10-12次',
    targetMuscles: '三角肌前束、胸大肌',
    difficulty: '新手',
  },
  {
    name: '腿部推蹬机',
    description: '针对腿部训练的固定器械,安全高效',
    usage: '坐姿进行腿部推蹬训练股四头肌',
    tips: '推蹬时膝盖不要超过脚尖',
    safety: '调整座椅位置,确保腿部自然弯曲',
    weightRange: '插片式可调',
    setsReps: '3-4组 x 12-15次',
    targetMuscles: '股四头肌、臀大肌',
    difficulty: '新手',
  },
];

const CARDIO_EQUIPMENTS = [
  {
    name: '跑步机',
    description: '最常见的有氧训练设备,模拟跑步运动',
    usage: '快走、慢跑或快跑,可调节速度和坡度',
    tips: '建议从低强度开始,逐步提升',
    safety: '跑步时注意保持正确姿势,避免过度冲击',
    weightRange: '速度0-20km/h',
    setsReps: '20-40分钟',
    targetMuscles: '心肺功能、下肢肌群',
    difficulty: '新手',
  },
  {
    name: '椭圆机',
    description: '低冲击有氧设备,适合关节不好的人群',
    usage: '模拟行走或跑步动作,全身参与运动',
    tips: '可以调节阻力和坡度增加难度',
    safety: '双脚平稳踩在踏板上,保持身体平衡',
    weightRange: '阻力1-20档可调',
    setsReps: '20-45分钟',
    targetMuscles: '心肺功能、全身协调',
    difficulty: '新手',
  },
  {
    name: '动感单车',
    description: '高强度有氧训练设备,燃脂效率高',
    usage: '坐姿或站姿骑行,可调节阻力',
    tips: '建议配合音乐进行间歇训练',
    safety: '调整座椅高度和把手位置',
    weightRange: '阻力1-20档可调',
    setsReps: '30-45分钟',
    targetMuscles: '心肺功能、股四头肌',
    difficulty: '进阶',
  },
  {
    name: '划船机',
    description: '全身性有氧运动,锻炼心肺和核心',
    usage: '坐姿划船动作,全身协调发力',
    tips: '注意呼吸节奏,发力时呼气',
    safety: '避免过度用力,保持动作连贯',
    weightRange: '风阻/水阻可调',
    setsReps: '15-30分钟',
    targetMuscles: '背阔肌、核心、心肺',
    difficulty: '进阶',
  },
];

const STRETCH_EQUIPMENTS = [
  {
    name: '瑜伽垫',
    description: '进行瑜伽、拉伸和核心训练的基础工具',
    usage: '进行各种拉伸动作、瑜伽体式、平板支撑等',
    tips: '训练前铺好垫子,保持地面清洁',
    safety: '选择防滑性能好的垫子',
    weightRange: '自重',
    setsReps: '10-30分钟',
    targetMuscles: '全身柔韧性、核心',
    difficulty: '新手',
  },
  {
    name: '泡沫轴',
    description: '进行筋膜放松的专业工具',
    usage: '滚动身体各部位,缓解肌肉紧张',
    tips: '滚动时在痛点停留10-15秒',
    safety: '不要在关节部位直接滚动',
    weightRange: '自重按压',
    setsReps: '每部位1-2分钟',
    targetMuscles: '全身筋膜放松',
    difficulty: '新手',
  },
  {
    name: '筋膜枪',
    description: '电动筋膜放松工具,深层按摩肌肉',
    usage: '对准肌肉群进行定点按摩',
    tips: '每个部位按摩1-2分钟',
    safety: '不要在骨骼、关节或头部使用',
    weightRange: '多档位可调',
    setsReps: '每部位1-2分钟',
    targetMuscles: '大肌群放松',
    difficulty: '新手',
  },
  {
    name: '拉伸带',
    description: '辅助拉伸的弹性带子',
    usage: '进行各种柔韧性训练和瑜伽动作',
    tips: '拉伸时保持呼吸,不要憋气',
    safety: '不要过度用力拉伸',
    weightRange: '多阻力可选',
    setsReps: '每个动作30秒 x 2-3组',
    targetMuscles: '全身柔韧性',
    difficulty: '新手',
  },
];

const FREE_WEIGHT_EQUIPMENTS = [
  {
    name: '深蹲架',
    description: '进行深蹲训练的专业设备',
    usage: '进行杠铃深蹲、过头推举等动作',
    tips: '深蹲时膝盖与脚尖方向一致',
    safety: '使用前确保架子稳定,有保护者',
    weightRange: '空杆20kg+配重片',
    setsReps: '3-5组 x 5-8次',
    targetMuscles: '股四头肌、臀大肌、核心',
    difficulty: '进阶',
  },
  {
    name: '卧推架',
    description: '进行卧推训练的专业设备',
    usage: '进行杠铃卧推、哑铃卧推等动作',
    tips: '推起时保持胸部挺起',
    safety: '必须有保护者在场',
    weightRange: '空杆20kg+配重片',
    setsReps: '3-4组 x 6-10次',
    targetMuscles: '胸大肌、三角肌前束、肱三头肌',
    difficulty: '进阶',
  },
  {
    name: '硬拉台',
    description: '进行硬拉训练的专业平台',
    usage: '进行杠铃硬拉训练',
    tips: '保持背部挺直,用腿发力',
    safety: '注意下背保护,循序渐进',
    weightRange: '空杆20kg+配重片',
    setsReps: '3-5组 x 3-6次',
    targetMuscles: '腘绳肌、臀大肌、背部',
    difficulty: '高手',
  },
  {
    name: '引体向上架',
    description: '进行背部训练的核心设备',
    usage: '进行引体向上、悬垂举腿等动作',
    tips: '初学者可以使用弹力带辅助',
    safety: '确保架子稳固',
    weightRange: '自重/负重',
    setsReps: '3-4组 x 力竭',
    targetMuscles: '背阔肌、肱二头肌',
    difficulty: '进阶',
  },
];

const SAFETY_TIPS = [
  { icon: Shield, title: '热身运动', desc: '训练前进行5-10分钟动态热身,激活身体' },
  { icon: AlertCircle, title: '动作规范', desc: '确保动作标准,避免因姿势错误导致受伤' },
  { icon: Target, title: '循序渐进', desc: '不要盲目追求大重量,逐步提升训练强度' },
  { icon: Heart, title: '及时补水', desc: '训练过程中适时补充水分' },
  { icon: Clock, title: '合理休息', desc: '训练后保证充足休息和恢复时间' },
];

const SOURCES = [
  { name: 'ACSM', fullName: '美国运动医学会', url: 'https://www.acsm.org/', desc: '全球最权威的运动科学与医学专业组织' },
  { name: 'NSCA', fullName: '美国国家体能协会', url: 'https://www.nsca.com/', desc: '体能训练领域的国际权威机构' },
  { name: 'WHO', fullName: '世界卫生组织', url: 'https://www.who.int/', desc: '全球公共卫生领域的权威机构' },
];

export default function EquipmentPage() {
  const getEquipmentList = (category: string) => {
    switch (category) {
      case 'strength': return STRENGTH_EQUIPMENTS;
      case 'cardio': return CARDIO_EQUIPMENTS;
      case 'stretching': return STRETCH_EQUIPMENTS;
      case 'freeweight': return FREE_WEIGHT_EQUIPMENTS;
      default: return [];
    }
  };

  return (
    <div className="max-w-content mx-auto px-6 py-8">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">器材指南手册</h1>
        <p className="text-sm text-text-secondary">
          了解场馆内各类器材的使用方法和注意事项,科学安全地进行训练。
          本指南参考国际权威机构的训练建议编制。
        </p>
      </div>

      {/* 分类导航 — 渐变色块+图标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {EQUIPMENT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.id} className="card overflow-hidden hover:shadow-lg transition-shadow group">
              <div className={`relative h-36 ${cat.gradientClass} flex items-center justify-center`}>
                <Icon size={56} strokeWidth={1.2} className="text-white/85 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-white/70 text-sm mb-0.5">{cat.subtitle}</div>
                  <h3 className="text-white font-semibold text-lg">{cat.title}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-text-secondary mb-3">{cat.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-tertiary">参考: {cat.source}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 详细器材列表 */}
      {EQUIPMENT_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const equipments = getEquipmentList(cat.id);
        return (
          <section key={cat.id} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-lg ${cat.gradientClass} text-white flex items-center justify-center`}>
                <Icon size={18} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary">{cat.title}</h2>
                <p className="text-sm text-text-tertiary">{cat.subtitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equipments.map((eq) => (
                <div key={eq.name} className="card overflow-hidden">
                  <div className="grid grid-cols-[100px_1fr]">
                    {/* 左侧渐变色块+图标 */}
                    <div className={`${cat.gradientClass} flex items-center justify-center`}>
                      <Icon size={32} strokeWidth={1.5} className="text-white/85" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-text-primary">{eq.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          eq.difficulty === '新手' ? 'bg-success/20 text-emerald-700' :
                          eq.difficulty === '进阶' ? 'bg-warning/20 text-amber-700' :
                          'bg-danger/20 text-red-700'
                        }`}>
                          {eq.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">{eq.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-primary-50 text-primary">{eq.weightRange}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-info/10 text-info">{eq.setsReps}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent">{eq.targetMuscles}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <Lightbulb size={12} className="text-primary mt-0.5 shrink-0" />
                          <span className="text-xs text-text-tertiary">{eq.usage}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <BookOpen size={12} className="text-info mt-0.5 shrink-0" />
                          <span className="text-xs text-text-tertiary">{eq.tips}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlertCircle size={12} className="text-danger mt-0.5 shrink-0" />
                          <span className="text-xs text-danger">{eq.safety}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* 安全提示 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-6">训练安全提示</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {SAFETY_TIPS.map((tip) => {
            const TipIcon = tip.icon;
            return (
              <div key={tip.title} className="card p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-3">
                  <TipIcon size={18} />
                </div>
                <h3 className="text-sm font-medium text-text-primary mb-1">{tip.title}</h3>
                <p className="text-xs text-text-tertiary">{tip.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 权威信息源 */}
      <section className="p-6 rounded-lg bg-bg-warm">
        <h2 className="text-lg font-semibold text-text-primary mb-4">参考资料来源</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SOURCES.map((s) => (
            <div key={s.name} className="flex items-start gap-3 p-4 rounded-lg bg-surface border border-border-light">
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary flex items-center justify-center font-bold shrink-0">
                {s.name}
              </div>
              <div>
                <div className="font-medium text-text-primary mb-1">{s.fullName}</div>
                <div className="text-sm text-text-tertiary mb-2">{s.desc}</div>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <ExternalLink size={10} /> 访问官网
                </a>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-text-tertiary text-center">
          本指南的训练建议基于上述权威机构的研究成果和推荐标准编制
        </p>
      </section>
    </div>
  );
}
