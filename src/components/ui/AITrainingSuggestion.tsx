'use client';

import { useState } from 'react';
import { Sparkles, Bot, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface AITrainingSuggestionProps {
  onSuggestion: (suggestion: string) => void;
}

const AI_SUGGESTIONS = [
  {
    target: '增肌',
    suggestions: [
      '第一天：胸肌+三头肌（卧推、飞鸟、臂屈伸）',
      '第二天：背肌+二头肌（引体向上、划船、弯举）',
      '第三天：腿部（深蹲、硬拉、腿举）',
      '休息一天，重复循环',
      '建议每次训练45-60分钟，组间休息60-90秒',
    ],
  },
  {
    target: '减脂',
    suggestions: [
      '周一：力量训练（全身）+ 30分钟有氧',
      '周二：HIIT训练（冲刺间歇）',
      '周三：力量训练（上半身）+ 20分钟有氧',
      '周四：休息或瑜伽拉伸',
      '周五：力量训练（下半身）+ 30分钟有氧',
      '周末：户外跑步或骑行',
    ],
  },
  {
    target: '塑形',
    suggestions: [
      '注重线条训练而非重量',
      '增加训练组数，减少每组次数',
      '加入大量核心训练（平板支撑、卷腹、俄罗斯转体）',
      '建议配合瑜伽或普拉提提升柔韧性',
      '每周至少2次全身塑形训练',
    ],
  },
  {
    target: '体能提升',
    suggestions: [
      '加入功能性训练（波比跳、开合跳、高抬腿）',
      '增加敏捷性训练（梯子训练、锥桶训练）',
      '提升心肺功能（跳绳、登山机）',
      '建议每周3次专项体能训练',
      '循序渐进，避免过度疲劳',
    ],
  },
  {
    target: '新手入门',
    suggestions: [
      '前两周以熟悉器械和动作为主',
      '从轻重量开始，保证动作标准',
      '学习基础动作：深蹲、硬拉、卧推、划船',
      '建议固定一位教练带练前3次',
      '每周训练3-4次，每次40分钟左右',
    ],
  },
];

export default function AITrainingSuggestion({ onSuggestion }: AITrainingSuggestionProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [expandedTarget, setExpandedTarget] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = (suggestions: string[]) => {
    const text = suggestions.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectTarget = (target: string) => {
    setSelectedTarget(target);
    const suggestion = AI_SUGGESTIONS.find((s) => s.target === target);
    if (suggestion) {
      onSuggestion(suggestion.suggestions.join('\n'));
    }
  };

  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
          <Bot className="text-primary" size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">AI 训练计划推荐</h3>
          <p className="text-xs text-text-secondary">智能生成个性化训练方案</p>
        </div>
      </div>

      <div className="space-y-2">
        {AI_SUGGESTIONS.map((item) => (
          <div key={item.target} className="border border-border-light rounded-lg overflow-hidden">
            <button
              onClick={() => {
                setExpandedTarget(expandedTarget === item.target ? null : item.target);
                handleSelectTarget(item.target);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                selectedTarget === item.target
                  ? 'bg-primary-50 border-primary/30'
                  : 'hover:bg-bg-warm'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary flex-shrink-0" />
                <span className="font-medium text-text-primary text-sm">{item.target}</span>
                {selectedTarget === item.target && (
                  <span className="badge bg-primary text-white text-xs">已选择</span>
                )}
              </div>
              {expandedTarget === item.target ? (
                <ChevronUp size={16} className="text-text-tertiary" />
              ) : (
                <ChevronDown size={16} className="text-text-tertiary" />
              )}
            </button>

            {expandedTarget === item.target && (
              <div className="px-4 pb-4 animate-fade-in">
                <ul className="space-y-2 mb-3">
                  {item.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="w-5 h-5 rounded-full bg-primary-50 text-primary flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCopy(item.suggestions)}
                  className="w-full btn-outline text-sm flex items-center justify-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      已复制到剪贴板
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      复制训练计划
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-text-tertiary mt-4 text-center">
        💡 选择训练目标后，AI 会自动生成建议填入训练需求
      </p>
    </div>
  );
}
