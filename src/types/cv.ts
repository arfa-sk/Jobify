export interface JsonResumeLocation {
    address?: string;
    postalCode?: string;
    city?: string;
    countryCode?: string;
    region?: string;
}

export interface JsonResumeProfile {
    network?: string;
    username?: string;
    url?: string;
}

export interface JsonResumeBasics {
    name?: string;
    label?: string;
    image?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: JsonResumeLocation;
    profiles?: JsonResumeProfile[];
}

export interface JsonResumeWorkItem {
    name?: string;
    company?: string;
    position?: string;
    jobTitle?: string;
    url?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
    description?: string;
}

export interface JsonResumeVolunteerItem {
    organization?: string;
    position?: string;
    url?: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
}

export interface JsonResumeEducationItem {
    institution?: string;
    url?: string;
    area?: string;
    studyType?: string;
    degree?: string;
    startDate?: string;
    endDate?: string;
    score?: string;
    courses?: string[];
}

export interface JsonResumeAwardItem {
    title?: string;
    date?: string;
    awarder?: string;
    summary?: string;
}

export interface JsonResumeCertificateItem {
    name?: string;
    date?: string;
    issuer?: string;
    url?: string;
}

export interface JsonResumePublicationItem {
    name?: string;
    publisher?: string;
    releaseDate?: string;
    url?: string;
    summary?: string;
}

export interface JsonResumeSkillItem {
    name?: string;
    level?: string;
    keywords?: string[];
}

export interface JsonResumeLanguageItem {
    language?: string;
    fluency?: string;
}

export interface JsonResumeInterestItem {
    name?: string;
    keywords?: string[];
}

export interface JsonResumeReferenceItem {
    name?: string;
    reference?: string;
}

export interface JsonResumeProjectItem {
    name?: string;
    description?: string;
    highlights?: string[];
    keywords?: string[];
    startDate?: string;
    endDate?: string;
    url?: string;
    roles?: string[];
    entity?: string;
    type?: string;
}

export interface JsonResumeSchema {
    basics?: JsonResumeBasics;
    work?: JsonResumeWorkItem[];
    volunteer?: JsonResumeVolunteerItem[];
    education?: JsonResumeEducationItem[];
    awards?: JsonResumeAwardItem[];
    certificates?: JsonResumeCertificateItem[];
    publications?: JsonResumePublicationItem[];
    skills?: JsonResumeSkillItem[];
    languages?: JsonResumeLanguageItem[];
    interests?: JsonResumeInterestItem[];
    references?: JsonResumeReferenceItem[];
    projects?: JsonResumeProjectItem[];
    meta?: {
        canonical?: string;
        version?: string;
        lastModified?: string;
        theme?: string;
    };
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'url'
  | 'email'
  | 'phone'
  | 'string-list'
  | 'object-list'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  required?: boolean
  itemFields?: FieldDef[]
}

export type SectionType =
  | 'single-object'
  | 'object-list'
  | 'string-list'
  | 'freetext'

export type DisplayStyle =
  | 'contact-block'
  | 'text-block'
  | 'timeline'
  | 'tag-cloud'
  | 'plain-list'
  | 'two-column-list'

export interface CvSectionDescriptor {
  key: string
  label: string
  sectionType: SectionType
  displayStyle: DisplayStyle
  fields: FieldDef[]
  order: number
  visible?: boolean
}

export interface CvDynamicPayload {
  descriptor: CvSectionDescriptor[]
  data: Record<string, any>
}
