export type PersonIdentity = {
  displayName: string;
};

export type MemoryChapter = {
  number: number;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
  image?: string;
};

export type ProductInstance = {
  id: string;
  version: number;
  title: string;
  description: string;
  socialImage?: string;
  recipient: PersonIdentity;
  sender: PersonIdentity;
  occasionLabel: string;
  storageNamespace: string;
  access: {
    passphrase: string;
    prompt: string;
    placeholder: string;
  };
  opening: {
    eyebrow: string;
    titleLines: [string, string];
    invitation: string;
    image?: string;
  };
  chapters: MemoryChapter[];
  finale: {
    eyebrow: string;
    heading: string;
    body: string;
    image?: string;
  };
};
