// src/app/core/data/mock-data.ts

import { BlogPost, TeamMember, Venture } from '../services/data.service';

/**
 * DATOS DE VENTURES (Innovation Lab)
 */
export const VENTURES: Venture[] = [
  {
    key: 'VIRTEEX',
    slug: 'virteex-ecosystem',
    name: 'virtex',
    descriptionKey: 'VENTURES.VIRTEEX_DESC',
    logoUrl: 'assets/imgs/logos/virteex.svg',
    status: 'Scale',
    website: 'https://virtex.com'
  },
  {
    key: 'PAYFLOW',
    slug: 'payflow-fintech',
    name: 'PayFlow',
    descriptionKey: 'VENTURES.PAYFLOW_DESC',
    logoUrl: 'assets/imgs/logos/payflow.svg',
    status: 'Accelerate',
    website: '#'
  },
  {
    key: 'AGROTECH',
    slug: 'smart-harvest',
    name: 'SmartHarvest',
    descriptionKey: 'VENTURES.SMARTHARVEST_DESC',
    logoUrl: 'assets/imgs/logos/agrotech.svg',
    status: 'Incubate',
    website: '#'
  }
];

/**
 * DATOS DE SOLUCIONES
 * Movido desde los componentes a este archivo central.
 */
export const SOLUTIONS = [
  {
    key: 'WEB',
    slug: 'web-development',
    date: '2025-05-15',
    icon: 'Monitor',
    heroImage: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?fit=crop&w=1200&q=80',
    sections: [
      {
        titleKey: 'SOLUTIONS.WEB_SECTION_FRONTEND_TITLE',
        contentKey: 'SOLUTIONS.WEB_SECTION_FRONTEND_DESC',
      },
      {
        titleKey: 'SOLUTIONS.WEB_SECTION_BACKEND_TITLE',
        contentKey: 'SOLUTIONS.WEB_SECTION_BACKEND_DESC',
      },
      {
        titleKey: 'SOLUTIONS.WEB_SECTION_DEVOPS_TITLE',
        contentKey: 'SOLUTIONS.WEB_SECTION_DEVOPS_DESC',
      },
    ],
    technologies: ['Angular', 'React', 'Vue.js', 'Node.js', 'NestJS', '.NET', 'AWS', 'Azure', 'Docker'],
  },
  {
    key: 'MOBILE',
    slug: 'mobile-apps',
    date: '2025-06-10',
    icon: 'Smartphone',
    heroImage: 'https://images.unsplash.com/photo-1607936834114-0a300c3f0b24?fit=crop&w=1200&q=80',
    sections: [
      {
        titleKey: 'SOLUTIONS.MOBILE_SECTION_NATIVE_TITLE',
        contentKey: 'SOLUTIONS.MOBILE_SECTION_NATIVE_DESC',
      },
      {
        titleKey: 'SOLUTIONS.MOBILE_SECTION_HYBRID_TITLE',
        contentKey: 'SOLUTIONS.MOBILE_SECTION_HYBRID_DESC',
      },
    ],
    technologies: ['Swift', 'Kotlin', 'Flutter', 'React Native', 'Firebase'],
  },
  {
    key: 'DESKTOP',
    slug: 'desktop-software',
    date: '2025-04-20',
    icon: 'Server',
    heroImage: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?fit=crop&w=1200&q=80',
    sections: [
      {
        titleKey: 'SOLUTIONS.DESKTOP_SECTION_WINDOWS_TITLE',
        contentKey: 'SOLUTIONS.DESKTOP_SECTION_WINDOWS_DESC',
      },
      {
        titleKey: 'SOLUTIONS.DESKTOP_SECTION_MACOS_TITLE',
        contentKey: 'SOLUTIONS.DESKTOP_SECTION_MACOS_DESC',
      },
    ],
    technologies: ['.NET', 'WPF', 'Electron', 'JavaFX', 'Swift'],
  },
  {
    key: 'CLOUD',
    slug: 'cloud-architecture',
    date: '2025-07-05',
    icon: 'Cloud',
    heroImage: 'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?fit=crop&w=1200&q=80',
    sections: [
      {
        titleKey: 'SOLUTIONS.CLOUD_SECTION_IAAS_TITLE',
        contentKey: 'SOLUTIONS.CLOUD_SECTION_IAAS_DESC',
      },
      {
        titleKey: 'SOLUTIONS.CLOUD_SECTION_PAAS_TITLE',
        contentKey: 'SOLUTIONS.CLOUD_SECTION_PAAS_DESC',
      },
      {
        titleKey: 'SOLUTIONS.CLOUD_SECTION_SAAS_TITLE',
        contentKey: 'SOLUTIONS.CLOUD_SECTION_SAAS_DESC',
      },
    ],
    technologies: ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform'],
  },
];

/**
 * DATOS DE PRODUCTOS
 * Movido desde los componentes a este archivo central.
 */
export const PRODUCTS = [
  {
    key: 'ERP',
    slug: 'virtex',
    icon: 'Database',
    type: 'erp',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?fit=crop&w=1200&q=80',
    externalUrl: 'https://virtex.com',
    featuresKeys: ['PRODUCTS.ERP_FEAT_1', 'PRODUCTS.ERP_FEAT_2', 'PRODUCTS.ERP_FEAT_3'],
  },
  {
    key: 'POS',
    slug: 'jsl-pos',
    icon: 'ShoppingCart',
    type: 'pos',
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?fit=crop&w=1200&q=80',
    externalUrl: 'https://pos.virtex.com',
    featuresKeys: ['PRODUCTS.POS_FEAT_1', 'PRODUCTS.POS_FEAT_2', 'PRODUCTS.POS_FEAT_3'],
  },
  {
    key: 'MOBILE_APPS',
    slug: 'proprietary-apps',
    icon: 'Smartphone',
    type: 'mobile',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?fit=crop&w=1200&q=80',
    externalUrl: 'https://apps.virtex.com',
    featuresKeys: ['PRODUCTS.MOBILE_APPS_FEAT_1', 'PRODUCTS.MOBILE_APPS_FEAT_2', 'PRODUCTS.MOBILE_APPS_FEAT_3'],
  },
];

/**
 * DATOS DEL PROCESO
 * Movido desde home.component.ts y requerido por process.component.ts
 */
export const PROCESS_STEPS = [
  {
    key: 'STEP1',
    icon: 'Compass',
  },
  {
    key: 'STEP2',
    icon: 'Code',
  },
  {
    key: 'STEP3',
    icon: 'Server',
  },
  {
    key: 'STEP4',
    icon: 'TrendingUp',
  },
];

/**
 * Datos de los miembros del equipo para la página "Nosotros".
 */
export const TEAM_MEMBERS: TeamMember[] = [
  {
    key: 'MEMBER_1',
    nameKey: 'ABOUT.TEAM_MEMBER_1_NAME',
    roleKey: 'ABOUT.TEAM_MEMBER_1_ROLE',
    bioKey: 'ABOUT.TEAM_MEMBER_1_BIO',
    imageUrl: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?fit=crop&w=300&q=80',
    linkedIn: 'https://linkedin.com/in/member1',
    twitter: 'https://twitter.com/member1',
    certifications: ['AWS Certified Architect', 'PMP']
  },
  {
    key: 'MEMBER_2',
    nameKey: 'ABOUT.TEAM_MEMBER_2_NAME',
    roleKey: 'ABOUT.TEAM_MEMBER_2_ROLE',
    bioKey: 'ABOUT.TEAM_MEMBER_2_BIO',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=300&q=80',
    linkedIn: 'https://linkedin.com/in/member2',
    twitter: 'https://twitter.com/member2',
    certifications: ['Google UX Design', 'Figma Expert']
  },
  {
    key: 'MEMBER_3',
    nameKey: 'ABOUT.TEAM_MEMBER_3_NAME',
    roleKey: 'ABOUT.TEAM_MEMBER_3_ROLE',
    bioKey: 'ABOUT.TEAM_MEMBER_3_BIO',
    imageUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?fit=crop&w=300&q=80',
    linkedIn: 'https://linkedin.com/in/member3',
    twitter: 'https://twitter.com/member3',
    certifications: ['Azure DevOps Engineer', 'CKA']
  },
  {
    key: 'MEMBER_4',
    nameKey: 'ABOUT.TEAM_MEMBER_4_NAME',
    roleKey: 'ABOUT.TEAM_MEMBER_4_ROLE',
    bioKey: 'ABOUT.TEAM_MEMBER_4_BIO',
    imageUrl: 'https://images.unsplash.com/photo-1507003211162-080c3e30NThl?fit=crop&w=300&q=80',
    linkedIn: 'https://linkedin.com/in/member4',
    twitter: 'https://twitter.com/member4',
    certifications: ['React Native Specialist', 'Scrum Master']
  },
];

/**
 * Datos de los testimonios para la página "Home".
 */
export const TESTIMONIALS = [
  {
    key: 'TESTIMONIAL_1',
    textKey: 'HOME.TESTIMONIAL_1_TEXT',
    nameKey: 'HOME.TESTIMONIAL_1_NAME',
    roleKey: 'HOME.TESTIMONIAL_1_ROLE',
    imageUrl: 'https://images.unsplash.com/photo-1573496359112-58e11a3b1a9e?fit=crop&w=100&q=80',
    ratingValue: 5,
    datePublished: '2025-09-12',
  },
  {
    key: 'TESTIMONIAL_2',
    textKey: 'HOME.TESTIMONIAL_2_TEXT',
    nameKey: 'HOME.TESTIMONIAL_2_NAME',
    roleKey: 'HOME.TESTIMONIAL_2_ROLE',
    imageUrl: 'https://images.unsplash.com/photo-1603415526960-f6e0328909af?fit=crop&w=100&q=80',
    ratingValue: 5,
    datePublished: '2025-10-05',
  },
  {
    key: 'TESTIMONIAL_3',
    textKey: 'HOME.TESTIMONIAL_3_TEXT',
    nameKey: 'HOME.TESTIMONIAL_3_NAME',
    roleKey: 'HOME.TESTIMONIAL_3_ROLE',
    imageUrl: 'assets/imgs/photo-1580489944761-15a19d654956.avif',
    ratingValue: 5,
    datePublished: '2025-10-28',
  },
];

/**
 * Datos de los casos de éxito (Proyectos).
 * El 'slug' se usa para la URL y para encontrar el proyecto.
 */
export const PROJECTS = [
  {
    key: 'CASE_ERP',
    slug: 'erp-logistics-optimization',
    date: '2025-08-12',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-577380e25f2b?fit=crop&w=600&q=80',
    category: 'Enterprise',
    metrics: ['30% Cost Reduction', '99.8% Inventory Accuracy'],
  },
  {
    key: 'CASE_ECOMMERCE',
    slug: 'b2b-ecommerce-platform',
    date: '2025-09-25',
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?fit=crop&w=600&q=80',
    category: 'Commerce',
    metrics: ['200% Order Increase', '45% Sales Growth'],
  },
  {
    key: 'CASE_MOBILE_APP',
    slug: 'fleet-management-mobile-app',
    date: '2025-10-02',
    imageUrl: 'https://images.unsplash.com/photo-1607936834114-0a300c3f0b24?fit=crop&w=600&q=80',
    category: 'Mobile',
    metrics: ['40% Efficiency Boost', '18% Fuel Savings'],
  },
];

/**
 * Datos de las entradas del blog.
 * El 'slug' se usa para la URL y para encontrar la entrada.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    key: 'POST_1',
    slug: 'future-of-angular-ssr',
    imageUrl: 'https://media.geeksforgeeks.org/wp-content/uploads/20240214151845/The-Future-of-Angular-JS-Top-Trends-&-Predictions.png',
    date: '2025-10-28',
    authorKey: 'MEMBER_1',
    tags: ['angular', 'ssr', 'frontend', 'performance'],
    readTime: 5,
    featured: true,
  },
  {
    key: 'POST_2',
    slug: 'ux-vs-ui-what-matters-most',
    imageUrl: 'https://zaibatsutechnology.co.uk/wp-content/uploads/2021/05/UI-vs-UX.png',
    date: '2025-10-22',
    authorKey: 'MEMBER_2',
    tags: ['ux', 'ui', 'design', 'frontend'],
    readTime: 3,
  },
  {
    key: 'POST_3',
    slug: 'cloud-architecture-scalability',
    imageUrl: 'https://www.muycomputerpro.com/wp-content/uploads/2018/07/arquitecto-cloud.jpg',
    date: '2025-10-15',
    authorKey: 'MEMBER_3',
    tags: ['cloud', 'architecture', 'devops', 'scalability'],
    readTime: 4,
  },
  {
    key: 'POST_4',
    slug: 'getting-started-with-react-vite',
    imageUrl: 'https://blog.openreplay.com/images/vite-create-react-app/images/hero.png',
    date: '2025-10-10',
    authorKey: 'MEMBER_4',
    tags: ['react', 'frontend', 'performance', 'tools'],
    readTime: 3,
  },
  {
    key: 'POST_5',
    slug: 'from-wireframe-to-hifi-in-figma',
    imageUrl: 'assets/imgs/Avif/photo-1587620962725-abab7fe55159.avif',
    date: '2025-10-05',
    authorKey: 'MEMBER_2',
    tags: ['design', 'ui', 'tools', 'ux'],
    readTime: 2,
  },
  {
    key: 'POST_6',
    slug: 'power-of-serverless-aws-lambda',
    imageUrl: 'https://www.prolim.com/wp-content/uploads/2023/07/power-of-serverless-computing.jpg',
    date: '2025-10-01',
    authorKey: 'MEMBER_3',
    tags: ['cloud', 'devops', 'serverless', 'aws'],
    readTime: 3,
  },
];

/**
 * DATOS DEL TECH STACK
 * Datos para la página de Tecnologías.
 */
export const TECH_STACK = [
  {
    key: 'FRONTEND',
    icon: 'Monitor',
    technologies: [
      { name: 'Angular', imageUrl: 'assets/imgs/logos/angular.svg' },
      { name: 'TypeScript', imageUrl: 'assets/imgs/logos/typescript.svg' },
      { name: 'JavaScript', imageUrl: 'assets/imgs/logos/javascript.svg' },
      { name: 'HTML5', imageUrl: 'assets/imgs/logos/html5.svg' },
      { name: 'Sass (SCSS)', imageUrl: 'assets/imgs/logos/sass.svg' },
      { name: 'RxJS', imageUrl: 'assets/imgs/logos/rxjs.svg' },
    ],
  },
  {
    key: 'BACKEND',
    icon: 'Server',
    technologies: [
      { name: 'Node.js', imageUrl: 'assets/imgs/logos/nodejs.svg' },
      { name: 'NestJS', imageUrl: 'assets/imgs/logos/nestjs.svg' },
      { name: 'Express', imageUrl: 'assets/imgs/logos/express.svg' },
      { name: 'C# / .NET', imageUrl: 'assets/imgs/logos/dotnet.svg' },
      { name: 'Python', imageUrl: 'assets/imgs/logos/python.svg' },
    ],
  },
  {
    key: 'DATABASE',
    icon: 'Database',
    technologies: [
      { name: 'PostgreSQL', imageUrl: 'assets/imgs/logos/postgresql.svg' },
      { name: 'MySQL', imageUrl: 'assets/imgs/logos/mysql.svg' },
      { name: 'MongoDB', imageUrl: 'assets/imgs/logos/mongodb.svg' },
      { name: 'Redis', imageUrl: 'assets/imgs/logos/redis.svg' },
      { name: 'SQL Server', imageUrl: 'assets/imgs/logos/sqlserver.svg' },
    ],
  },
  {
    key: 'CLOUD_DEVOPS',
    icon: 'CloudCog',
    technologies: [
      { name: 'AWS', imageUrl: 'assets/imgs/logos/aws.svg' },
      { name: 'Azure', imageUrl: 'assets/imgs/logos/azure.svg' },
      { name: 'Docker', imageUrl: 'assets/imgs/logos/docker.svg' },
      { name: 'Terraform', imageUrl: 'assets/imgs/logos/terraform.svg' },
      { name: 'Git', imageUrl: 'assets/imgs/logos/git.svg' },
    ],
  },
  {
    key: 'MOBILE',
    icon: 'Smartphone',
    technologies: [
      { name: 'Flutter', imageUrl: 'assets/imgs/logos/flutter.svg' },
      { name: 'React Native', imageUrl: 'assets/imgs/logos/react.svg' },
      { name: 'Swift (iOS)', imageUrl: 'assets/imgs/logos/swift.svg' },
      { name: 'Kotlin (Android)', imageUrl: 'assets/imgs/logos/kotlin.svg' },
    ],
  },
];

/**
 * DATOS DE CLIENTES / PARTNERS
 */
export const PARTNERS = [
  { name: 'Microsoft', imageUrl: 'assets/imgs/logos/microsoft.svg' },
  { name: 'Google', imageUrl: 'assets/imgs/logos/google-cloud.svg' },
  { name: 'Amazon', imageUrl: 'assets/imgs/logos/aws.svg' },
  { name: 'Docker', imageUrl: 'assets/imgs/logos/docker.svg' },
  { name: 'Salesforce', imageUrl: 'assets/imgs/logos/salesforce.svg' }
];

/**
 * DATOS DE POSICIONES DE CARRERAS
 */
export const CAREER_POSITIONS = [
  {
    key: 'POS_1',
    locationKey: 'CAREERS.LOCATION_REMOTE',
    typeKey: 'CAREERS.TYPE_FULLTIME',
    postedDate: '2025-01-15',
  },
  {
    key: 'POS_2',
    locationKey: 'CAREERS.LOCATION_HYBRID',
    typeKey: 'CAREERS.TYPE_FULLTIME',
    postedDate: '2025-02-01',
  },
];

/**
 * DATOS DE PREGUNTAS FRECUENTES (FAQ)
 */
export const FAQ_ITEMS = [
  { questionKey: 'FAQ.Q1_TITLE',  answerKey: 'FAQ.Q1_DESC',  category: 'services'  },
  { questionKey: 'FAQ.Q2_TITLE',  answerKey: 'FAQ.Q2_DESC',  category: 'services'  },
  { questionKey: 'FAQ.Q3_TITLE',  answerKey: 'FAQ.Q3_DESC',  category: 'pricing'   },
  { questionKey: 'FAQ.Q4_TITLE',  answerKey: 'FAQ.Q4_DESC',  category: 'pricing'   },
  { questionKey: 'FAQ.Q5_TITLE',  answerKey: 'FAQ.Q5_DESC',  category: 'process'   },
  { questionKey: 'FAQ.Q6_TITLE',  answerKey: 'FAQ.Q6_DESC',  category: 'process'   },
  { questionKey: 'FAQ.Q7_TITLE',  answerKey: 'FAQ.Q7_DESC',  category: 'technical' },
  { questionKey: 'FAQ.Q8_TITLE',  answerKey: 'FAQ.Q8_DESC',  category: 'technical' },
];
