// 页脚
import Link from 'next/link';
import { Mail, MessageCircle, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border-light bg-bg-warm">
      <div className="max-w-content mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-bold text-text-primary mb-2">复旦健身社</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            学生自发组织的健身互助平台,帮助社员科学训练、安全进阶。
            互助带练,共同成长。
          </p>
        </div>
        <div>
          <h4 className="font-medium text-text-primary mb-3 text-sm">快速导航</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li><Link href="/" className="hover:text-primary">首页</Link></li>
            <li><Link href="/venues" className="hover:text-primary">场馆介绍</Link></li>
            <li><Link href="/booking" className="hover:text-primary">预约带练</Link></li>
            <li><Link href="/profile" className="hover:text-primary">个人中心</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-text-primary mb-3 text-sm">联系我们</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-center gap-2"><Mail size={14} /> fudanfitness@fudan.edu.cn</li>
            <li className="flex items-center gap-2"><MessageCircle size={14} /> 微信公众号:复旦健身社</li>
            <li className="flex items-center gap-2"><MapPin size={14} /> 邯郸校区南区学生活动中心B1</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border-light py-4 text-center">
        <p className="text-[11px] text-text-tertiary leading-relaxed px-4 mb-2">
          本项目为校园健身互助平台 Demo，当前展示内容及账号数据均为演示用途。
          请勿输入真实密码、隐私信息或敏感健康数据。
        </p>
        <p className="text-xs text-text-tertiary">
          © {new Date().getFullYear()} 复旦健身社互助预约平台 · 学生社团内部使用 · MVP Demo
        </p>
      </div>
    </footer>
  );
}
