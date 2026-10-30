import type { Language } from '../i18n/types'

/**
 * Títulos de seção do currículo em cada idioma. Arquivo próprio para a tela
 * da home (criador de currículo, §2.160) poder usá-los sem levar junto os
 * prompts da reescrita e o léxico de clichês para o navegador.
 */
export const SECTION_TITLES: Record<Language, { summary: string; experience: string; education: string; skills: string; languages: string }> = {
  pt: { summary: 'Resumo Profissional', experience: 'Experiência Profissional', education: 'Formação Acadêmica', skills: 'Habilidades Técnicas e Comportamentais', languages: 'Idiomas e Certificações' },
  en: { summary: 'Professional Summary', experience: 'Professional Experience', education: 'Education', skills: 'Core Skills & Technical Proficiencies', languages: 'Languages & Certifications' },
  es: { summary: 'Resumen Profesional', experience: 'Experiencia Profesional', education: 'Educación y Formación', skills: 'Habilidades Técnicas y Competencias', languages: 'Idiomas y Certificaciones' },
  de: { summary: 'Berufliches Profil', experience: 'Berufserfahrung', education: 'Ausbildung & Studium', skills: 'Kenntnisse und Kernkompetenzen', languages: 'Sprachen & Zertifikate' },
  fr: { summary: 'Profil professionnel', experience: 'Expérience professionnelle', education: 'Formation et diplômes', skills: 'Compétences techniques et clés', languages: 'Langues et certifications' },
  it: { summary: 'Profilo professionale', experience: 'Esperienza professionale', education: 'Istruzione e formazione', skills: 'Competenze tecniche e personali', languages: 'Lingue e certificazioni' },
  ja: { summary: '職務要約', experience: '職務経歴', education: '学歴', skills: '保有スキル・専門知識', languages: '語学力・保有資格' },
  nl: { summary: 'Professioneel profiel', experience: 'Werkervaring', education: 'Opleiding en training', skills: 'Vaardigheden en kerncompetenties', languages: 'Talenkennis en certificaten' },
  sv: { summary: 'Professionell sammanfattning', experience: 'Arbetslivserfarenhet', education: 'Utbildning', skills: 'Kompetenser och färdigheter', languages: 'Språk och certifieringar' },
  zh: { summary: '个人总结与求职意向', experience: '工作经历与项目经验', education: '教育背景', skills: '专业技能与核心专长', languages: '语言能力与资格认证' },
  ar: { summary: 'الملخص المهني', experience: 'الخبرات المهنية', education: 'المؤهلات العلمية', skills: 'المهارات والكفاءات الأساسية', languages: 'اللغات والشهادات المهنية' },
  ko: { summary: '직무 요약 및 핵심 역량', experience: '주요 경력 및 프로젝트', education: '학력 사항', skills: '전문 스킬 및 핵심 역량', languages: '어학 능력 및 자격증' },
}
