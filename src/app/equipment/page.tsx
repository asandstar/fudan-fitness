'use client';

// 详细器材指南页
import {
  Dumbbell, Activity, StretchHorizontal, TrendingUp,
  ChevronRight, ExternalLink, Shield, Clock, Target,
  Heart, AlertCircle, Lightbulb, BookOpen,
} from 'lucide-react';

const EQUIPMENT_CATEGORIES = [
  {
    id: 'strength',
    icon: Dumbbell,
    title: '力量器械区',
    subtitle: '增肌与力量训练',
    color: 'primary',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gym%20weight%20training%20equipment%20dumbbells%20barbells%20cable%20machine%20professional%20fitness%20interior&image_size=landscape_16_9',
    description: '力量器械区配备了完整的综合训练设备,适合增肌、力量提升和塑形训练。建议初学者从固定器械开始,逐步过渡到自由重量。',
    source: 'ACSM运动指南',
  },
  {
    id: 'cardio',
    icon: Activity,
    title: '有氧训练区',
    subtitle: '减脂与心肺提升',
    color: 'success',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gym%20cardio%20equipment%20treadmills%20elliptical%20stationary%20bike%20rower%20clean%20modern%20gym&image_size=landscape_16_9',
    description: '有氧训练区提供多种心肺训练设备,帮助提升心肺功能和减脂。建议每周进行3-5次中等强度有氧运动。',
    source: 'WHO健康指南',
  },
  {
    id: 'stretching',
    icon: StretchHorizontal,
    title: '拉伸放松区',
    subtitle: '柔韧性与恢复',
    color: 'info',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=yoga%20stretching%20area%20yoga%20mats%20foam%20rollers%20relaxation%20peaceful%20gym%20interior&image_size=landscape_16_9',
    description: '拉伸放松区是训练前后必不可少的区域,配备专业的放松恢复设备,帮助预防受伤和加速恢复。',
    source: 'NSCA训练指南',
  },
  {
    id: 'freeweight',
    icon: TrendingUp,
    title: '自由重量区',
    subtitle: '进阶力量训练',
    color: 'danger',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=free%20weight%20gym%20area%20squat%20rack%20bench%20press%20power%20lifting%20professional%20equipment&image_size=landscape_16_9',
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
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dumbbells%20gym%20equipment%20various%20weights%20professional%20fitness&image_size=square',
  },
  {
    name: '杠铃',
    description: '力量训练的核心工具,能最大化刺激肌肉生长',
    usage: '进行深蹲、卧推、硬拉、站姿推举等复合动作',
    tips: '建议在有经验的教练指导下开始使用',
    safety: '使用时确保有保护者在场,注意动作规范',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=barbell%20gym%20equipment%20weight%20lifting%20professional&image_size=square',
  },
  {
    name: '龙门架/绳索训练器',
    description: '多功能训练设备,可进行多种孤立和复合动作',
    usage: '下拉、划船、夹胸、弯举、侧平举等多种动作',
    tips: '调整滑轮高度可以改变训练角度和难度',
    safety: '使用前检查绳索和滑轮是否正常',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cable%20machine%20gym%20equipment%20crossover%20professional%20fitness&image_size=square',
  },
  {
    name: '高位下拉机',
    description: '专门针对背部训练的固定器械',
    usage: '坐姿进行宽握或窄握下拉训练背阔肌',
    tips: '下拉时感受背部发力,避免手臂代偿',
    safety: '调整座椅高度,确保膝盖固定',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lat%20pulldown%20machine%20gym%20equipment%20back%20training&image_size=square',
  },
  {
    name: '坐姿推举机',
    description: '针对肩部和胸部训练的固定器械',
    usage: '坐姿进行肩部推举或胸部推举',
    tips: '推举时保持背部挺直,不要后仰借力',
    safety: '选择合适重量,避免耸肩',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shoulder%20press%20machine%20gym%20equipment%20professional&image_size=square',
  },
  {
    name: '腿部推蹬机',
    description: '针对腿部训练的固定器械,安全高效',
    usage: '坐姿进行腿部推蹬训练股四头肌',
    tips: '推蹬时膝盖不要超过脚尖',
    safety: '调整座椅位置,确保腿部自然弯曲',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=leg%20press%20machine%20gym%20equipment%20leg%20training&image_size=square',
  },
];

const CARDIO_EQUIPMENTS = [
  {
    name: '跑步机',
    description: '最常见的有氧训练设备,模拟跑步运动',
    usage: '快走、慢跑或快跑,可调节速度和坡度',
    tips: '建议从低强度开始,逐步提升',
    safety: '跑步时注意保持正确姿势,避免过度冲击',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=treadmill%20gym%20equipment%20running%20machine%20professional&image_size=square',
  },
  {
    name: '椭圆机',
    description: '低冲击有氧设备,适合关节不好的人群',
    usage: '模拟行走或跑步动作,全身参与运动',
    tips: '可以调节阻力和坡度增加难度',
    safety: '双脚平稳踩在踏板上,保持身体平衡',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elliptical%20machine%20gym%20equipment%20cardio%20low%20impact&image_size=square',
  },
  {
    name: '动感单车',
    description: '高强度有氧训练设备,燃脂效率高',
    usage: '坐姿或站姿骑行,可调节阻力',
    tips: '建议配合音乐进行间歇训练',
    safety: '调整座椅高度和把手位置',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stationary%20bike%20spin%20bike%20gym%20equipment%20cardio&image_size=square',
  },
  {
    name: '划船机',
    description: '全身性有氧运动,锻炼心肺和核心',
    usage: '坐姿划船动作,全身协调发力',
    tips: '注意呼吸节奏,发力时呼气',
    safety: '避免过度用力,保持动作连贯',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rowing%20machine%20gym%20equipment%20cardio%20full%20body&image_size=square',
  },
];

const STRETCH_EQUIPMENTS = [
  {
    name: '瑜伽垫',
    description: '进行瑜伽、拉伸和核心训练的基础工具',
    usage: '进行各种拉伸动作、瑜伽体式、平板支撑等',
    tips: '训练前铺好垫子,保持地面清洁',
    safety: '选择防滑性能好的垫子',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=yoga%20mat%20fitness%20equipment%20stretching%20yoga&image_size=square',
  },
  {
    name: '泡沫轴',
    description: '进行筋膜放松的专业工具',
    usage: '滚动身体各部位,缓解肌肉紧张',
    tips: '滚动时在痛点停留10-15秒',
    safety: '不要在关节部位直接滚动',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=foam%20roller%20fitness%20equipment%20recovery%20muscle&image_size=square',
  },
  {
    name: '筋膜枪',
    description: '电动筋膜放松工具,深层按摩肌肉',
    usage: '对准肌肉群进行定点按摩',
    tips: '每个部位按摩1-2分钟',
    safety: '不要在骨骼、关节或头部使用',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=massage%20gun%20fitness%20equipment%20recovery%20tool&image_size=square',
  },
  {
    name: '拉伸带',
    description: '辅助拉伸的弹性带子',
    usage: '进行各种柔韧性训练和瑜伽动作',
    tips: '拉伸时保持呼吸,不要憋气',
    safety: '不要过度用力拉伸',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=resistance%20band%20stretching%20fitness%20equipment&image_size=square',
  },
];

const FREE_WEIGHT_EQUIPMENTS = [
  {
    name: '深蹲架',
    description: '进行深蹲训练的专业设备',
    usage: '进行杠铃深蹲、过头推举等动作',
    tips: '深蹲时膝盖与脚尖方向一致',
    safety: '使用前确保架子稳定,有保护者',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=squat%20rack%20gym%20equipment%20power%20lifting&image_size=square',
  },
  {
    name: '卧推架',
    description: '进行卧推训练的专业设备',
    usage: '进行杠铃卧推、哑铃卧推等动作',
    tips: '推起时保持胸部挺起',
    safety: '必须有保护者在场',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bench%20press%20gym%20equipment%20chest%20training&image_size=square',
  },
  {
    name: '硬拉台',
    description: '进行硬拉训练的专业平台',
    usage: '进行杠铃硬拉训练',
    tips: '保持背部挺直,用腿发力',
    safety: '注意下背保护,循序渐进',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=deadlift%20platform%20gym%20equipment%20power%20lifting&image_size=square',
  },
  {
    name: '引体向上架',
    description: '进行背部训练的核心设备',
    usage: '进行引体向上、悬垂举腿等动作',
    tips: '初学者可以使用弹力带辅助',
    safety: '确保架子稳固',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pull%20up%20bar%20gym%20equipment%20back%20training&image_size=square',
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
      case 'strength':
        return STRENGTH_EQUIPMENTS;
      case 'cardio':
        return CARDIO_EQUIPMENTS;
      case 'stretching':
        return STRETCH_EQUIPMENTS;
      case 'freeweight':
        return FREE_WEIGHT_EQUIPMENTS;
      default:
        return [];
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

      {/* 分类导航 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {EQUIPMENT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-36 overflow-hidden">
                <img src={cat.image} alt={cat.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center backdrop-blur`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-white/80 text-sm">{cat.subtitle}</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg">{cat.title}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-text-secondary mb-3">{cat.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-tertiary">参考: {cat.source}</span>
                  <button className="text-sm text-primary flex items-center gap-1">
                    查看详情 <ChevronRight size={14} />
                  </button>
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
              <div className={`w-10 h-10 rounded-lg bg-${cat.color}-50 text-${cat.color} flex items-center justify-center`}>
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
                  <div className="grid grid-cols-2">
                    <div className="relative">
                      <img src={eq.image} alt={eq.name} className="w-full h-full object-cover min-h-[150px]" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-text-primary mb-2">{eq.name}</h3>
                      <p className="text-xs text-text-secondary mb-2">{eq.description}</p>
                      <div className="space-y-2">
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
            const Icon = tip.icon;
            return (
              <div key={tip.title} className="card p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-3">
                  <Icon size={18} />
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
