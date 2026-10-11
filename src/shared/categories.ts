// The catalogue of fillable field categories plus the alias dictionary the
// matcher scores against. Keeping this in one place makes the "intelligence"
// of the extension easy to audit and extend.

export type Category =
  // Personal
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'fullName'
  | 'preferredName'
  | 'email'
  | 'phone'
  | 'address1'
  | 'address2'
  | 'city'
  | 'state'
  | 'zip'
  | 'country'
  | 'nationality'
  | 'dob'
  | 'driversLicence'
  // Links
  | 'linkedin'
  | 'github'
  | 'portfolio'
  | 'website'
  | 'twitter'
  // Work authorisation
  | 'authorizedToWork'
  | 'requiresSponsorship'
  // Employment
  | 'currentCompany'
  | 'currentTitle'
  | 'yearsExperience'
  | 'currentSalary'
  | 'desiredSalary'
  | 'salaryRate'
  | 'noticePeriod'
  | 'prevCompany'
  | 'prevTitle'
  // Education
  | 'degree'
  | 'school'
  | 'fieldOfStudy'
  | 'graduationYear'
  // EEO / demographic
  | 'gender'
  | 'race'
  | 'veteran'
  | 'disability'
  // Long text
  | 'coverLetter'
  | 'whyCompany'
  | 'aboutYourself'
  // Special / never auto-filled with text
  | 'resumeUpload'
  | 'captcha'
  | 'ssn'
  | 'unknown';

export interface AliasSpec {
  positive: string[];
  /** If any of these appear in a *strong* signal the category is vetoed. */
  negative?: string[];
}

export const CATEGORY_ALIASES: Partial<Record<Category, AliasSpec>> = {
  firstName: { positive: ['first name', 'firstname', 'given name', 'fname', 'forename', 'first'] },
  middleName: { positive: ['middle name', 'middle initial', 'middlename', 'middle'] },
  lastName: {
    positive: ['last name', 'lastname', 'surname', 'family name', 'lname', 'last'],
    negative: ['company', 'school', 'city']
  },
  fullName: {
    positive: ['full name', 'fullname', 'your name', 'legal name', 'name'],
    negative: [
      'first', 'last', 'middle', 'company', 'business', 'user', 'file', 'domain',
      'school', 'host', 'nick', 'display', 'organization', 'organisation',
      'employer', 'product', 'project', 'card', 'account', 'street', 'city',
      'university', 'college'
    ]
  },
  preferredName: { positive: ['preferred name', 'nickname', 'nick name', 'display name', 'preferred first name'] },
  email: { positive: ['email', 'e mail', 'email address', 'mail id'] },
  phone: { positive: ['phone', 'phone number', 'telephone', 'telephone number', 'mobile', 'mobile number', 'mobile phone', 'mobile no', 'cell', 'cell phone', 'cellphone', 'cell no', 'cell number', 'contact number', 'contact no', 'tel'] },
  address1: {
    positive: ['address', 'street address', 'address line 1', 'address1', 'street', 'mailing address', 'home address', 'current address'],
    negative: ['email address', 'address line 2', 'address2']
  },
  address2: { positive: ['address line 2', 'address2', 'apt', 'apartment', 'suite', 'unit number'] },
  city: { positive: ['city', 'town', 'municipality', 'locality'] },
  state: { positive: ['state', 'province', 'region', 'state province', 'county'] },
  zip: { positive: ['zip', 'zip code', 'postal code', 'postcode', 'postal', 'pincode', 'pin code'] },
  country: { positive: ['country', 'nation', 'country region', 'country of residence'] },
  nationality: {
    positive: ['nationality', 'citizenship', 'nationality country'],
    negative: ['dual', 'second nationality']
  },
  dob: { positive: ['date of birth', 'dob', 'birth date', 'birthdate', 'birthday'] },
  driversLicence: {
    positive: [
      'drivers licence', 'drivers license', 'driver s licence', 'driver s license',
      'driver licence', 'driver license', 'driving licence', 'driving license',
      'licence code', 'license code'
    ]
  },
  linkedin: { positive: ['linkedin'] },
  github: { positive: ['github'] },
  portfolio: { positive: ['portfolio', 'work samples', 'personal site'] },
  website: { positive: ['website', 'web site', 'homepage', 'personal website', 'blog'] },
  twitter: { positive: ['twitter', 'twitter handle'] },
  authorizedToWork: {
    positive: [
      'authorized to work', 'legally authorized', 'work authorization', 'eligible to work',
      'right to work', 'permission to work', 'authorized to work in the united states'
    ]
  },
  requiresSponsorship: { positive: ['require sponsorship', 'need sponsorship', 'sponsorship', 'visa sponsorship', 'require visa'] },
  currentCompany: {
    positive: ['current company', 'current employer', 'employer', 'company name', 'company', 'organization', 'organisation'],
    negative: ['previous', 'prior', 'former']
  },
  currentTitle: {
    positive: ['current title', 'job title', 'title', 'position', 'role', 'current position', 'occupation'],
    negative: ['page title', 'job description']
  },
  yearsExperience: { positive: ['years of experience', 'years experience', 'total experience', 'experience in years', 'yrs of experience'] },
  currentSalary: { positive: ['current salary', 'present salary', 'current ctc', 'current compensation'] },
  desiredSalary: {
    positive: [
      'desired salary', 'expected salary', 'salary expectation', 'expected ctc',
      'desired compensation', 'expected compensation', 'salary requirement',
      'salary', 'gross salary'
    ]
  },
  salaryRate: {
    positive: [
      'salary rate', 'pay rate', 'rate of pay', 'salary period', 'payment period',
      'salary frequency', 'pay frequency', 'remuneration period'
    ]
  },
  noticePeriod: {
    positive: [
      'notice period', 'notice', 'earliest start', 'available from',
      'availability to join', 'availability', 'available', 'earliest availability',
      'available date', 'when can you start', 'start date availability'
    ]
  },
  prevCompany: { positive: ['previous company', 'previous employer', 'prior company', 'last company', 'former employer'] },
  prevTitle: { positive: ['previous title', 'previous position', 'prior role', 'previous role'] },
  degree: { positive: ['degree', 'highest degree', 'education level', 'qualification', 'degree type'] },
  school: { positive: ['school', 'university', 'college', 'institution', 'school name', 'university name', 'alma mater'] },
  fieldOfStudy: { positive: ['field of study', 'major', 'discipline', 'specialization'] },
  graduationYear: { positive: ['graduation year', 'year of graduation', 'graduation date', 'year of passing', 'passing year'] },
  gender: { positive: ['gender', 'sex'] },
  race: {
    positive: [
      'race', 'ethnicity', 'ethnic background', 'race ethnicity',
      'employment equity', 'equity status', 'employment equity status', 'equity'
    ]
  },
  veteran: { positive: ['veteran', 'veteran status', 'protected veteran'] },
  disability: { positive: ['disability', 'disability status', 'disabled'] },
  coverLetter: { positive: ['cover letter', 'covering letter', 'coverletter'] },
  whyCompany: {
    positive: [
      'why do you want to work', 'why do you want to join', 'why this company',
      'why are you interested', 'motivation for applying', 'what interests you',
      'why do you want to apply'
    ]
  },
  aboutYourself: { positive: ['about yourself', 'tell us about yourself', 'professional summary', 'summary', 'bio', 'about me', 'introduce yourself'] },
  resumeUpload: { positive: ['resume', 'curriculum vitae', 'attach resume', 'upload resume', 'cv'] },
  captcha: { positive: ['captcha', 'recaptcha', 'are you human', 'verification code'] },
  ssn: {
    positive: [
      'social security', 'ssn', 'national id', 'national insurance', 'tax id',
      'passport number', 'passport no', 'identity number', 'id number',
      'national id number', 'aadhaar', 'aadhar'
    ]
  }
};

/** `autocomplete` attribute tokens map almost 1:1 to a category. */
export const AUTOCOMPLETE_MAP: Record<string, Category> = {
  name: 'fullName',
  'given-name': 'firstName',
  'additional-name': 'middleName',
  'family-name': 'lastName',
  nickname: 'preferredName',
  email: 'email',
  tel: 'phone',
  'tel-national': 'phone',
  'street-address': 'address1',
  'address-line1': 'address1',
  'address-line2': 'address2',
  'address-level2': 'city',
  'address-level1': 'state',
  'postal-code': 'zip',
  country: 'country',
  'country-name': 'country',
  organization: 'currentCompany',
  'organization-title': 'currentTitle',
  url: 'website',
  bday: 'dob'
};

/** Categories whose value is a yes/no decision rather than free text. */
export const BOOLEAN_CATEGORIES: readonly Category[] = ['authorizedToWork', 'requiresSponsorship'];

/** Categories that must never be auto-filled. */
export const NEVER_FILL: readonly Category[] = ['captcha', 'ssn', 'unknown', 'resumeUpload'];

export const ALL_CATEGORIES = Object.keys(CATEGORY_ALIASES) as Category[];
