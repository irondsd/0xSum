import { Github, Twitter, FileText } from 'lucide-react';
import s from './Footer.module.scss';

const links = [
  { icon: Github, href: 'https://github.com', label: 'GitHub' },
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: FileText, href: '/docs', label: 'Docs' },
];

export function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.logo}>
        <span className={s.logoText}>0xSum</span>
      </div>

      <nav className={s.links}>
        {links.map(({ icon: Icon, href, label }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={s.link}
            aria-label={label}
          >
            <Icon className={s.icon} />
            <span className={s.linkText}>{label}</span>
          </a>
        ))}
      </nav>

      <p className={s.copyright}>
        © {new Date().getFullYear()} 0xSum. All rights reserved.
      </p>
    </footer>
  );
}
