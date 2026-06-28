export type TableType = 'wisdoms' | 'hadiths' | 'taqibat' | 'munajat';

export interface BaseContent {
  id: string;
  text: string;
  tags?: string[];
  tag_status?: string;
}

export interface TableConfig {
  value: TableType;
  label: string;
  prefix: string;
}

export const TABLES_CONFIG: TableConfig[] = [
  { value: 'wisdoms', label: 'الحكم', prefix: 'W' },
  { value: 'hadiths', label: 'الأحاديث', prefix: 'H' },
  { value: 'taqibat', label: 'التعقيبات', prefix: 'T' },
  { value: 'munajat', label: 'المناجاة', prefix: 'M' },
];

export interface Progress {
  last_wisdom_id: string;
  last_hadith_id: string;
  last_taqibat_id: string;
  last_munajat_id: string; // inferred
}
