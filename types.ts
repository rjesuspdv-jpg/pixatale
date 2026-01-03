
export enum Language {
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  BILINGUAL = 'Bilingual (English & Spanish)'
}

export interface StoryPage {
  pageNumber: number;
  content: string;
  imagePrompt: string;
  imageUrl?: string;
  textPosition?: 'top' | 'bottom';
}

export interface StoryBook {
  title: string;
  coverImagePrompt: string; // New: Prompt specific for the book cover
  coverImageUrl?: string;   // New: The generated URL for the cover
  pages: StoryPage[];
}

export type GenerationStatus = 'idle' | 'writing' | 'illustrating' | 'ready' | 'error';
