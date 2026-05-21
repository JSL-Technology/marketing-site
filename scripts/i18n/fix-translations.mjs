/**
 * Comprehensive i18n fix script.
 * Applies all missing / incorrect translations across all 10 non-English locales.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const I18N_DIR = resolve(__dirname, '../../apps/app/src/assets/i18n');

function deepSet(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let curr = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!curr[keys[i]]) curr[keys[i]] = {};
    curr = curr[keys[i]];
  }
  curr[keys[keys.length - 1]] = value;
}

/** Only patches keys whose current value equals the English value (true bugs).
 *  Skips keys that already have a proper translation to avoid regressions.
 */
function applyPatches(data, enData, patches) {
  let count = 0;
  for (const [keyPath, newValue] of Object.entries(patches)) {
    const keys = keyPath.split('.');
    const currentValue = keys.reduce((o, k) => o && o[k], data);
    const enValue = keys.reduce((o, k) => o && o[k], enData);
    if (currentValue === enValue) {
      deepSet(data, keyPath, newValue);
      count++;
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Patches per language  (only genuine untranslated / wrong strings)
// ---------------------------------------------------------------------------

const patches = {

  // ── ESPAÑOL ──────────────────────────────────────────────────────────────
  es: {
    'ERRORS.GO_HOME':            'Ir al Inicio',
    'PRICING.ANNUAL_SAVINGS':    'Ahorro Anual',
    'HOME.BLOG_EYEBROW':         'Ideas y Noticias',
    'PROJECTS.METRICS_TITLE':    'Métricas de Impacto',
    'VENTURES.TITLE':            'Ventures & Laboratorio de Innovación',
    'ALT.AUTHOR':                'Autor',
    'ALT.GOVERNANCE':            'Gobierno Corporativo',
    'ALT.LIFE_AT_JSL':           'Vida en JSL',
  },

  // ── PORTUGUÊS ────────────────────────────────────────────────────────────
  pt: {
    'ERRORS.GO_HOME':            'Ir para o Início',
    'HOME.BLOG_EYEBROW':         'Insights e Notícias',
    'PROJECTS.METRICS_TITLE':    'Métricas de Impacto',
    'VENTURES.TITLE':            'Ventures & Laboratório de Inovação',
    'ALT.AUTHOR':                'Autor',
    'ALT.GOVERNANCE':            'Governança Corporativa',
    'ALT.LIFE_AT_JSL':           'Vida na JSL',
  },

  // ── FRANÇAIS ─────────────────────────────────────────────────────────────
  fr: {
    'ERRORS.GO_HOME':            "Aller à l'accueil",
    'HOME.BLOG_EYEBROW':         'Actualités & Insights',
    'PROJECTS.METRICS_TITLE':    "Métriques d'impact",
    'VENTURES.TITLE':            "Ventures & Laboratoire d'Innovation",
    'ALT.AUTHOR':                'Auteur',
    'ALT.GOVERNANCE':            "Gouvernance d'entreprise",
    'ALT.LIFE_AT_JSL':           'La vie chez JSL',
  },

  // ── DEUTSCH ──────────────────────────────────────────────────────────────
  de: {
    // Accessibility (ARIA)
    'ARIA.BREADCRUMB':           'Brotkrümel-Navigation',
    'ARIA.PREVIOUS_PAGE':        'Vorherige Seite',
    'ARIA.NEXT_PAGE':            'Nächste Seite',
    'ARIA.SEARCH':               'Suchen',
    'ARIA.CLOSE':                'Schließen',
    'ARIA.CLOSE_MODAL':          'Modal schließen',
    'ARIA.WATCH_REEL':           'Unser Video-Reel ansehen',
    'ARIA.PREVIOUS_SLIDE':       'Vorherige Folie',
    'ARIA.NEXT_SLIDE':           'Nächste Folie',
    'ARIA.PARTNERS':             'Vertrauenswürdige Partner',
    'ARIA.TOGGLE_MENU':          'Menü umschalten',
    'ARIA.CLOSE_MENU':           'Menü schließen',
    'ARIA.SELECT_LANGUAGE':      'Sprache auswählen',
    'ARIA.HOME_LINK':            'JSL Technology Startseite',
    'ARIA.DESKTOP_NAV':          'Desktop-Navigation',
    // Share
    'SHARE.LABEL':               'Diesen Artikel teilen',
    'SHARE.EMAIL':               'E-Mail',
    'SHARE.SHARE_LINKEDIN':      'Auf LinkedIn teilen',
    'SHARE.SHARE_TWITTER':       'Auf Twitter teilen',
    'SHARE.SHARE_FACEBOOK':      'Auf Facebook teilen',
    'SHARE.SHARE_EMAIL':         'Per E-Mail teilen',
    'SHARE.COPY_LINK':           'Link kopieren',
    // Blog UI
    'BLOG.FEATURED_BADGE':       'Ausgewählter Artikel',
    'BLOG.SEARCH_PLACEHOLDER':   'Artikel suchen...',
    'BLOG.READ_TIME_UNIT':       'Min. Lesezeit',
    'BLOG.EYEBROW':              'Neueste Beiträge',
    // Errors / Thank-you / 404
    'ERRORS.GO_HOME':            'Zur Startseite',
    'THANK_YOU.GO_HOME':         'Zurück zur Startseite',
    'THANK_YOU.MSG_TITLE':       'Nachricht erfolgreich gesendet',
    'NOT_FOUND.ALT':             'Illustration für nicht gefundene Seite',
    // Home
    'HOME.BLOG_EYEBROW':         'Einblicke & Neuigkeiten',
    'HOME.LEARN_MORE':           'Mehr über uns erfahren',
    'HOME.HERO1_ALT':            'JSL Technology – Digitale Innovation und Softwareentwicklung',
    'HOME.HERO2_ALT':            'ERP-Software für Unternehmensführung – JSL Technology',
    // Search
    'SEARCH.PLACEHOLDER':        'Suchen...',
    'SEARCH.NO_RESULTS':         'Keine Ergebnisse gefunden.',
    'SEARCH.ALL':                'Alle',
    'SEARCH.PRODUCTS':           'Produkte',
    'SEARCH.PROJECTS':           'Projekte',
    // Solutions / Projects / Ventures
    'SOLUTIONS.RELATED':         'Ähnliche Lösungen',
    'PROJECTS.METRICS_TITLE':    'Leistungskennzahlen',
    'VENTURES.TITLE':            'Ventures & Innovationslabor',
    // Alt text
    'ALT.AUTHOR':                'Autor',
    'ALT.GOVERNANCE':            'Unternehmensführung',
    'ALT.LIFE_AT_JSL':           'Arbeitsleben bei JSL',
    'ABOUT.HERO_ALT':            'JSL Technology Team bei der Arbeit an Softwarearchitektur und digitalen Lösungen',
    // Investors
    'INVESTORS.GOVERNANCE_TITLE':'Unternehmensführung',
    // Security / Pricing
    'SECURITY_CENTER.DRP':       'Notfallwiederherstellung',
    'PRICING.OTHERS':            'Andere',
    'PRICING.CLOUD_NATIVE':      'Cloud-nativ',
  },

  // ── ARABIC ───────────────────────────────────────────────────────────────
  ar: {
    // Accessibility (ARIA)
    'ARIA.BREADCRUMB':           'مسار التنقل',
    'ARIA.PREVIOUS_PAGE':        'الصفحة السابقة',
    'ARIA.NEXT_PAGE':            'الصفحة التالية',
    'ARIA.SEARCH':               'بحث',
    'ARIA.CLOSE':                'إغلاق',
    'ARIA.CLOSE_MODAL':          'إغلاق النافذة',
    'ARIA.WATCH_REEL':           'شاهد مقطع الفيديو',
    'ARIA.PREVIOUS_SLIDE':       'الشريحة السابقة',
    'ARIA.NEXT_SLIDE':           'الشريحة التالية',
    'ARIA.PARTNERS':             'شركاء موثوقون',
    'ARIA.TOGGLE_MENU':          'تبديل القائمة',
    'ARIA.CLOSE_MENU':           'إغلاق القائمة',
    'ARIA.SELECT_LANGUAGE':      'اختر اللغة',
    'ARIA.HOME_LINK':            'الصفحة الرئيسية لـ JSL Technology',
    'ARIA.DESKTOP_NAV':          'تنقل سطح المكتب',
    // Share
    'SHARE.LABEL':               'شارك هذا المقال',
    'SHARE.SHARE_LINKEDIN':      'شارك على LinkedIn',
    'SHARE.SHARE_TWITTER':       'شارك على Twitter',
    'SHARE.SHARE_FACEBOOK':      'شارك على Facebook',
    'SHARE.SHARE_EMAIL':         'شارك عبر البريد الإلكتروني',
    'SHARE.COPY_LINK':           'نسخ الرابط',
    // Blog UI
    'BLOG.FEATURED_BADGE':       'مقال مميز',
    'BLOG.SEARCH_PLACEHOLDER':   'البحث في المقالات...',
    'BLOG.READ_TIME_UNIT':       'دقيقة قراءة',
    'BLOG.EYEBROW':              'آخر التحديثات',
    // Errors / Thank-you / 404
    'ERRORS.GO_HOME':            'العودة للرئيسية',
    'THANK_YOU.GO_HOME':         'العودة للرئيسية',
    'THANK_YOU.MSG_TITLE':       'تم إرسال الرسالة بنجاح',
    'NOT_FOUND.ALT':             'صورة الصفحة غير الموجودة',
    // Home
    'HOME.BLOG_EYEBROW':         'رؤى وأخبار',
    'HOME.LEARN_MORE':           'اعرف المزيد عنا',
    'HOME.HERO1_ALT':            'JSL Technology - الابتكار الرقمي وتطوير البرمجيات',
    'HOME.HERO2_ALT':            'برنامج ERP لإدارة الأعمال - JSL Technology',
    // Search
    'SEARCH.PLACEHOLDER':        'بحث...',
    'SEARCH.NO_RESULTS':         'لم يتم العثور على نتائج.',
    'SEARCH.ALL':                'الكل',
    'SEARCH.PRODUCTS':           'المنتجات',
    'SEARCH.PROJECTS':           'المشاريع',
    'SEARCH.VENTURES':           'المشاريع الريادية',
    // Solutions / Projects / Ventures
    'SOLUTIONS.RELATED':         'حلول ذات صلة',
    'PROJECTS.METRICS_TITLE':    'مقاييس الأثر',
    'VENTURES.TITLE':            'المشاريع الريادية ومختبر الابتكار',
    // Alt text
    'ALT.AUTHOR':                'المؤلف',
    'ALT.GOVERNANCE':            'حوكمة الشركات',
    'ALT.LIFE_AT_JSL':           'الحياة في JSL',
    'ABOUT.HERO_ALT':            'فريق JSL Technology يعمل على هندسة البرمجيات والحلول الرقمية',
  },

  // ── ITALIANO ─────────────────────────────────────────────────────────────
  it: {
    // Accessibility (ARIA)
    'ARIA.BREADCRUMB':           'Navigazione a briciole di pane',
    'ARIA.PREVIOUS_PAGE':        'Pagina precedente',
    'ARIA.NEXT_PAGE':            'Pagina successiva',
    'ARIA.SEARCH':               'Cerca',
    'ARIA.CLOSE':                'Chiudi',
    'ARIA.CLOSE_MODAL':          'Chiudi finestra modale',
    'ARIA.WATCH_REEL':           'Guarda il nostro video reel',
    'ARIA.PREVIOUS_SLIDE':       'Diapositiva precedente',
    'ARIA.NEXT_SLIDE':           'Diapositiva successiva',
    'ARIA.PARTNERS':             'Partner di fiducia',
    'ARIA.TOGGLE_MENU':          'Attiva/Disattiva menu',
    'ARIA.CLOSE_MENU':           'Chiudi menu',
    'ARIA.SELECT_LANGUAGE':      'Seleziona lingua',
    'ARIA.HOME_LINK':            'Home JSL Technology',
    'ARIA.DESKTOP_NAV':          'Navigazione desktop',
    // Share
    'SHARE.LABEL':               'Condividi questo articolo',
    'SHARE.SHARE_LINKEDIN':      'Condividi su LinkedIn',
    'SHARE.SHARE_TWITTER':       'Condividi su Twitter',
    'SHARE.SHARE_FACEBOOK':      'Condividi su Facebook',
    'SHARE.SHARE_EMAIL':         'Condividi via e-mail',
    'SHARE.COPY_LINK':           'Copia link',
    // Blog UI
    'BLOG.FEATURED_BADGE':       'Articolo in Evidenza',
    'BLOG.SEARCH_PLACEHOLDER':   'Cerca articoli...',
    'BLOG.READ_TIME_UNIT':       'min di lettura',
    'BLOG.EYEBROW':              'Ultimi Aggiornamenti',
    // Errors / Thank-you / 404
    'ERRORS.GO_HOME':            'Vai alla Home',
    'THANK_YOU.GO_HOME':         'Torna alla Home',
    'THANK_YOU.MSG_TITLE':       'Messaggio Inviato con Successo',
    'NOT_FOUND.ALT':             'Illustrazione Pagina Non Trovata',
    // Home
    'HOME.BLOG_EYEBROW':         'Approfondimenti e Notizie',
    'HOME.LEARN_MORE':           'Scopri di più su di noi',
    'HOME.HERO1_ALT':            'JSL Technology - Innovazione Digitale e Sviluppo Software',
    'HOME.HERO2_ALT':            'Software ERP per la Gestione Aziendale - JSL Technology',
    // Search
    'SEARCH.PLACEHOLDER':        'Cerca...',
    'SEARCH.NO_RESULTS':         'Nessun risultato trovato.',
    'SEARCH.ALL':                'Tutti',
    'SEARCH.PRODUCTS':           'Prodotti',
    'SEARCH.PROJECTS':           'Progetti',
    // Solutions / Projects / Ventures
    'SOLUTIONS.RELATED':         'Soluzioni Correlate',
    'PROJECTS.METRICS_TITLE':    'Metriche di Impatto',
    'VENTURES.TITLE':            'Ventures & Laboratorio di Innovazione',
    // Alt text
    'ALT.AUTHOR':                'Autore',
    'ALT.GOVERNANCE':            'Governance Aziendale',
    'ALT.LIFE_AT_JSL':           'Vita in JSL',
    'ABOUT.HERO_ALT':            'Il team di JSL Technology al lavoro su architettura software e soluzioni digitali',
    // Security
    'SECURITY_CENTER.DRP':       'Ripristino di Emergenza',
  },

  // ── 日本語 ────────────────────────────────────────────────────────────────
  ja: {
    // Accessibility (ARIA)
    'ARIA.BREADCRUMB':           'パンくずリスト',
    'ARIA.PREVIOUS_PAGE':        '前のページ',
    'ARIA.NEXT_PAGE':            '次のページ',
    'ARIA.SEARCH':               '検索',
    'ARIA.CLOSE':                '閉じる',
    'ARIA.CLOSE_MODAL':          'モーダルを閉じる',
    'ARIA.WATCH_REEL':           '動画リールを見る',
    'ARIA.PREVIOUS_SLIDE':       '前のスライド',
    'ARIA.NEXT_SLIDE':           '次のスライド',
    'ARIA.PARTNERS':             '信頼できるパートナー',
    'ARIA.TOGGLE_MENU':          'メニューを切り替える',
    'ARIA.CLOSE_MENU':           'メニューを閉じる',
    'ARIA.SELECT_LANGUAGE':      '言語を選択',
    'ARIA.HOME_LINK':            'JSL Technology ホーム',
    'ARIA.DESKTOP_NAV':          'デスクトップナビゲーション',
    // Share
    'SHARE.LABEL':               'この記事をシェアする',
    'SHARE.SHARE_LINKEDIN':      'LinkedInでシェア',
    'SHARE.SHARE_TWITTER':       'Twitterでシェア',
    'SHARE.SHARE_FACEBOOK':      'Facebookでシェア',
    'SHARE.SHARE_EMAIL':         'メールでシェア',
    'SHARE.COPY_LINK':           'リンクをコピー',
    // Blog UI
    'BLOG.FEATURED_BADGE':       '注目記事',
    'BLOG.SEARCH_PLACEHOLDER':   '記事を検索...',
    'BLOG.READ_TIME_UNIT':       '分で読める',
    'BLOG.EYEBROW':              '最新情報',
    // Errors / Thank-you / 404
    'ERRORS.GO_HOME':            'ホームへ',
    'THANK_YOU.GO_HOME':         'ホームに戻る',
    'THANK_YOU.MSG_TITLE':       'メッセージが正常に送信されました',
    'NOT_FOUND.ALT':             'ページが見つかりません',
    // Home
    'HOME.BLOG_EYEBROW':         'インサイト＆ニュース',
    'HOME.LEARN_MORE':           '私たちについてもっと知る',
    'HOME.HERO1_ALT':            'JSL Technology - デジタルイノベーションとソフトウェア開発',
    'HOME.HERO2_ALT':            '企業管理のためのERPソフトウェア - JSL Technology',
    // Search
    'SEARCH.PLACEHOLDER':        '検索...',
    'SEARCH.NO_RESULTS':         '結果が見つかりませんでした。',
    'SEARCH.ALL':                'すべて',
    'SEARCH.PRODUCTS':           '製品',
    'SEARCH.PROJECTS':           'プロジェクト',
    'SEARCH.VENTURES':           'ベンチャー',
    // Solutions / Projects / Ventures
    'SOLUTIONS.RELATED':         '関連ソリューション',
    'PROJECTS.METRICS_TITLE':    '成果指標',
    'VENTURES.TITLE':            'ベンチャーズ＆イノベーションラボ',
    // Alt text
    'ALT.AUTHOR':                '著者',
    'ALT.GOVERNANCE':            'コーポレートガバナンス',
    'ALT.LIFE_AT_JSL':           'JSLでの生活',
    'ABOUT.HERO_ALT':            'JSL Technologyチームがソフトウェアアーキテクチャとデジタルソリューションに取り組んでいます',
  },

  // ── 한국어 ────────────────────────────────────────────────────────────────
  ko: {
    // Accessibility (ARIA)
    'ARIA.BREADCRUMB':           '탐색 경로',
    'ARIA.PREVIOUS_PAGE':        '이전 페이지',
    'ARIA.NEXT_PAGE':            '다음 페이지',
    'ARIA.SEARCH':               '검색',
    'ARIA.CLOSE':                '닫기',
    'ARIA.CLOSE_MODAL':          '모달 닫기',
    'ARIA.WATCH_REEL':           '동영상 릴 보기',
    'ARIA.PREVIOUS_SLIDE':       '이전 슬라이드',
    'ARIA.NEXT_SLIDE':           '다음 슬라이드',
    'ARIA.PARTNERS':             '신뢰할 수 있는 파트너',
    'ARIA.TOGGLE_MENU':          '메뉴 열기/닫기',
    'ARIA.CLOSE_MENU':           '메뉴 닫기',
    'ARIA.SELECT_LANGUAGE':      '언어 선택',
    'ARIA.HOME_LINK':            'JSL Technology 홈',
    'ARIA.DESKTOP_NAV':          '데스크톱 내비게이션',
    // Share
    'SHARE.LABEL':               '이 기사 공유하기',
    'SHARE.SHARE_LINKEDIN':      'LinkedIn에서 공유',
    'SHARE.SHARE_TWITTER':       'Twitter에서 공유',
    'SHARE.SHARE_FACEBOOK':      'Facebook에서 공유',
    'SHARE.SHARE_EMAIL':         '이메일로 공유',
    'SHARE.COPY_LINK':           '링크 복사',
    // Blog UI
    'BLOG.FEATURED_BADGE':       '주요 기사',
    'BLOG.SEARCH_PLACEHOLDER':   '기사 검색...',
    'BLOG.READ_TIME_UNIT':       '분 읽기',
    'BLOG.EYEBROW':              '최신 업데이트',
    // Errors / Thank-you / 404
    'ERRORS.GO_HOME':            '홈으로',
    'THANK_YOU.GO_HOME':         '홈으로 돌아가기',
    'THANK_YOU.MSG_TITLE':       '메시지가 성공적으로 전송되었습니다',
    'NOT_FOUND.ALT':             '페이지를 찾을 수 없음',
    // Home
    'HOME.BLOG_EYEBROW':         '인사이트 & 뉴스',
    'HOME.LEARN_MORE':           '저희에 대해 더 알아보기',
    'HOME.HERO1_ALT':            'JSL Technology - 디지털 혁신 및 소프트웨어 개발',
    'HOME.HERO2_ALT':            '비즈니스 관리를 위한 ERP 소프트웨어 - JSL Technology',
    // Search
    'SEARCH.PLACEHOLDER':        '검색...',
    'SEARCH.NO_RESULTS':         '결과를 찾을 수 없습니다.',
    'SEARCH.ALL':                '전체',
    'SEARCH.PRODUCTS':           '제품',
    'SEARCH.PROJECTS':           '프로젝트',
    'SEARCH.VENTURES':           '벤처',
    // Solutions / Projects / Ventures
    'SOLUTIONS.RELATED':         '관련 솔루션',
    'PROJECTS.METRICS_TITLE':    '성과 지표',
    'VENTURES.TITLE':            '벤처스 & 이노베이션 랩',
    // Alt text
    'ALT.AUTHOR':                '저자',
    'ALT.GOVERNANCE':            '기업 지배구조',
    'ALT.LIFE_AT_JSL':           'JSL에서의 생활',
    'ABOUT.HERO_ALT':            'JSL Technology 팀이 소프트웨어 아키텍처와 디지털 솔루션 작업 중',
  },

  // ── 中文 ─────────────────────────────────────────────────────────────────
  zh: {
    // Accessibility (ARIA)
    'ARIA.BREADCRUMB':           '面包屑导航',
    'ARIA.PREVIOUS_PAGE':        '上一页',
    'ARIA.NEXT_PAGE':            '下一页',
    'ARIA.SEARCH':               '搜索',
    'ARIA.CLOSE':                '关闭',
    'ARIA.CLOSE_MODAL':          '关闭弹窗',
    'ARIA.WATCH_REEL':           '观看我们的视频',
    'ARIA.PREVIOUS_SLIDE':       '上一张幻灯片',
    'ARIA.NEXT_SLIDE':           '下一张幻灯片',
    'ARIA.PARTNERS':             '可信赖的合作伙伴',
    'ARIA.TOGGLE_MENU':          '切换菜单',
    'ARIA.CLOSE_MENU':           '关闭菜单',
    'ARIA.SELECT_LANGUAGE':      '选择语言',
    'ARIA.HOME_LINK':            'JSL Technology 主页',
    'ARIA.DESKTOP_NAV':          '桌面导航',
    // Share
    'SHARE.LABEL':               '分享这篇文章',
    'SHARE.SHARE_LINKEDIN':      '在LinkedIn上分享',
    'SHARE.SHARE_TWITTER':       '在Twitter上分享',
    'SHARE.SHARE_FACEBOOK':      '在Facebook上分享',
    'SHARE.SHARE_EMAIL':         '通过电子邮件分享',
    'SHARE.COPY_LINK':           '复制链接',
    // Blog UI
    'BLOG.FEATURED_BADGE':       '精选文章',
    'BLOG.SEARCH_PLACEHOLDER':   '搜索文章...',
    'BLOG.READ_TIME_UNIT':       '分钟阅读',
    'BLOG.EYEBROW':              '最新动态',
    // Errors / Thank-you / 404
    'ERRORS.GO_HOME':            '返回首页',
    'THANK_YOU.GO_HOME':         '返回首页',
    'THANK_YOU.MSG_TITLE':       '消息发送成功',
    'NOT_FOUND.ALT':             '页面未找到插图',
    // Home
    'HOME.BLOG_EYEBROW':         '洞察与新闻',
    'HOME.LEARN_MORE':           '了解我们更多',
    'HOME.HERO1_ALT':            'JSL Technology - 数字创新与软件开发',
    'HOME.HERO2_ALT':            '企业管理ERP软件 - JSL Technology',
    // Search
    'SEARCH.PLACEHOLDER':        '搜索...',
    'SEARCH.NO_RESULTS':         '未找到结果。',
    'SEARCH.ALL':                '全部',
    'SEARCH.PRODUCTS':           '产品',
    'SEARCH.PROJECTS':           '项目',
    'SEARCH.VENTURES':           '创业项目',
    // Solutions / Projects / Ventures
    'SOLUTIONS.RELATED':         '相关解决方案',
    'PROJECTS.METRICS_TITLE':    '影响力指标',
    'VENTURES.TITLE':            '创业项目与创新实验室',
    // Alt text
    'ALT.AUTHOR':                '作者',
    'ALT.GOVERNANCE':            '公司治理',
    'ALT.LIFE_AT_JSL':           'JSL的工作生活',
    'ABOUT.HERO_ALT':            'JSL Technology团队致力于软件架构和数字解决方案',
  },

  // ── KREYÒL AYISYEN ───────────────────────────────────────────────────────
  ht: {
    // Accessibility (ARIA)
    'ARIA.BREADCRUMB':           'Chemen navigasyon',
    'ARIA.PREVIOUS_PAGE':        'Paj anvan',
    'ARIA.NEXT_PAGE':            'Paj pwochen',
    'ARIA.SEARCH':               'Chèche',
    'ARIA.CLOSE':                'Fèmen',
    'ARIA.CLOSE_MODAL':          'Fèmen fenèt modal',
    'ARIA.WATCH_REEL':           'Gade videyo nou an',
    'ARIA.PREVIOUS_SLIDE':       'Slayd anvan',
    'ARIA.NEXT_SLIDE':           'Slayd pwochen',
    'ARIA.PARTNERS':             'Patnè fiyab',
    'ARIA.TOGGLE_MENU':          'Bascile meni',
    'ARIA.CLOSE_MENU':           'Fèmen meni',
    'ARIA.SELECT_LANGUAGE':      'Chwazi lang',
    'ARIA.HOME_LINK':            'Akèy JSL Technology',
    'ARIA.DESKTOP_NAV':          'Navigasyon òdinatè',
    // Share
    'SHARE.LABEL':               'Pataje atik sa a',
    'SHARE.SHARE_LINKEDIN':      'Pataje sou LinkedIn',
    'SHARE.SHARE_TWITTER':       'Pataje sou Twitter',
    'SHARE.SHARE_FACEBOOK':      'Pataje sou Facebook',
    'SHARE.SHARE_EMAIL':         'Pataje pa imèl',
    'SHARE.COPY_LINK':           'Kopi lyen',
    // Blog UI
    'BLOG.FEATURED_BADGE':       'Atik Seleksyone',
    'BLOG.SEARCH_PLACEHOLDER':   'Chèche atik...',
    'BLOG.READ_TIME_UNIT':       'min lekti',
    'BLOG.EYEBROW':              'Dènye Mizajou',
    // Errors / Thank-you / 404
    'ERRORS.GO_HOME':            'Retounen Lakay',
    'THANK_YOU.GO_HOME':         'Retounen Lakay',
    'THANK_YOU.MSG_TITLE':       'Mesaj Voye ak Siksè',
    'NOT_FOUND.ALT':             'Ilustrasyon Paj Pa Jwenn',
    // Home
    'HOME.BLOG_EYEBROW':         'Enfòmasyon & Nouvèl',
    'HOME.LEARN_MORE':           'Aprann plis sou nou',
    'HOME.HERO1_ALT':            'JSL Technology - Inovasyon Dijital ak Devlopman Lojisyèl',
    'HOME.HERO2_ALT':            'Lojisyèl ERP pou Jesyon Antrepriz - JSL Technology',
    // Search
    'SEARCH.PLACEHOLDER':        'Chèche...',
    'SEARCH.NO_RESULTS':         'Pa gen rezilta jwenn.',
    'SEARCH.ALL':                'Tout',
    'SEARCH.PRODUCTS':           'Pwodui',
    'SEARCH.PROJECTS':           'Pwojè',
    'SEARCH.VENTURES':           'Antrepriz',
    // Solutions / Projects / Ventures
    'SOLUTIONS.RELATED':         'Solisyon Enpòtan',
    'PROJECTS.METRICS_TITLE':    'Metrik Enpak',
    'VENTURES.TITLE':            'Antrepriz & Laboratwa Inovasyon',
    // Alt text
    'ALT.AUTHOR':                'Otè',
    'ALT.GOVERNANCE':            'Gouvènans Kòporatif',
    'ALT.LIFE_AT_JSL':           'Lavi nan JSL',
    'ABOUT.HERO_ALT':            'Ekip JSL Technology k ap travay sou achitekti lojisyèl ak solisyon dijital',
  },
};

// ---------------------------------------------------------------------------
// Apply and write
// ---------------------------------------------------------------------------

const enData = JSON.parse(readFileSync(`${I18N_DIR}/en.json`, 'utf8'));

let totalFixed = 0;
for (const [lang, langPatches] of Object.entries(patches)) {
  const filePath = `${I18N_DIR}/${lang}.json`;
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const fixed = applyPatches(data, enData, langPatches);
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`${lang.toUpperCase()}: ${fixed} keys updated`);
  totalFixed += fixed;
}

console.log(`\nTotal: ${totalFixed} translations applied across all languages.`);
