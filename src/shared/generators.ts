// Plausible random values for "dummy" mode, keyed by field category.
// Values are intentionally generic/example-only (555 phone numbers,
// example.com email domains, etc.) so nothing real is ever emitted.

import type { Category } from './categories';

const FIRST_NAMES = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Olivia', 'Robert', 'Sophia', 'Daniel', 'Grace', 'Liam', 'Aisha', 'Noah', 'Chloe'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Taylor', 'Anderson', 'Nkosi', 'Patel', 'Chen', 'Okafor'];
const STREETS = ['Main Street', 'Oak Avenue', 'Maple Drive', 'Cedar Lane', 'Sunset Boulevard', 'Riverside Road', 'Park Avenue'];
const CITIES = ['Springfield', 'Riverside', 'Franklin', 'Greenville', 'Bristol', 'Clinton', 'Fairview', 'Salem'];
const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];
const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'Netherlands', 'South Africa', 'India', 'Brazil', 'Singapore'];
const COMPANIES = ['Acme Corp', 'Globex', 'Initech', 'Umbrella Labs', 'Northwind Traders', 'Stark Industries', 'Wayne Enterprises'];
const TITLES = ['Software Engineer', 'Senior Software Engineer', 'Product Manager', 'Data Analyst', 'UX Designer', 'Project Manager', 'Business Analyst'];
const DEGREES = ["Bachelor's Degree", "Master's Degree", 'Associate Degree', 'Doctorate', 'High School Diploma'];
const FIELDS_OF_STUDY = ['Computer Science', 'Information Technology', 'Software Engineering', 'Business Administration', 'Mechanical Engineering', 'Data Science', 'Economics'];
const SCHOOLS = ['State University', 'Institute of Technology', 'City College', 'University of Cape Town', 'National University'];
const GENDERS = ['Male', 'Female', 'Decline to self-identify'];
const RACES = [
  'American Indian or Alaska Native', 'Asian', 'Black or African American',
  'Hispanic or Latino', 'White', 'Two or More Races', 'Decline to self-identify'
];
const VETERAN_STATUS = [
  'I am not a protected veteran',
  'I identify as one or more of the classifications of a protected veteran',
  "I don't wish to answer"
];
const DISABILITY_STATUS = [
  'No, I do not have a disability',
  'Yes, I have a disability',
  "I don't wish to answer"
];

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function digits(count: number): string {
  let out = '';
  for (let i = 0; i < count; i++) out += Math.floor(Math.random() * 10);
  return out;
}

function randomDateWithinYears(years: number): string {
  const today = new Date();
  const past = new Date(today.getFullYear() - years, today.getMonth(), today.getDate());
  const time = past.getTime() + Math.random() * (today.getTime() - past.getTime());
  const date = new Date(time);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function randomValueFor(category: Category): string | boolean | null {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const slug = `${first}.${last}`.toLowerCase();

  switch (category) {
    case 'firstName': return first;
    case 'middleName': return pick(['A', 'B', 'C', 'D', 'E']);
    case 'lastName': return last;
    case 'fullName': return `${first} ${last}`;
    case 'preferredName': return first;
    case 'email': return `${slug}${Math.floor(Math.random() * 100)}@example.com`;
    // 555-01xx numbers are reserved for fictional use.
    case 'phone': return `(555) 01${digits(2)}-${digits(4)}`;
    case 'address1': return `${Math.floor(Math.random() * 9000) + 100} ${pick(STREETS)}`;
    case 'address2': return `Apt ${Math.floor(Math.random() * 40) + 1}`;
    case 'city': return pick(CITIES);
    case 'state': return pick(STATES);
    case 'zip': return digits(5);
    case 'country': return pick(COUNTRIES);
    case 'dob': return randomDateWithinYears(40);

    case 'linkedin': return `https://www.linkedin.com/in/${slug.replace('.', '-')}`;
    case 'github': return `https://github.com/${slug.replace('.', '')}`;
    case 'portfolio': return `https://${slug.replace('.', '')}.dev`;
    case 'website': return `https://${slug.replace('.', '')}.example.com`;
    case 'twitter': return `https://twitter.com/${slug.replace('.', '')}`;

    case 'authorizedToWork': return true;
    case 'requiresSponsorship': return false;

    case 'currentCompany': return pick(COMPANIES);
    case 'currentTitle': return pick(TITLES);
    case 'yearsExperience': return String(Math.floor(Math.random() * 15) + 1);
    case 'currentSalary': return String((Math.floor(Math.random() * 8) + 5) * 10000);
    case 'desiredSalary': return String((Math.floor(Math.random() * 8) + 6) * 10000);
    case 'noticePeriod': return pick(['Immediately', '2 weeks', '30 days', '1 month']);
    case 'prevCompany': return pick(COMPANIES);
    case 'prevTitle': return pick(TITLES);

    case 'degree': return pick(DEGREES);
    case 'school': return pick(SCHOOLS);
    case 'fieldOfStudy': return pick(FIELDS_OF_STUDY);
    case 'graduationYear': return String(new Date().getFullYear() - (Math.floor(Math.random() * 8) + 1));

    case 'gender': return pick(GENDERS);
    case 'race': return pick(RACES);
    case 'veteran': return pick(VETERAN_STATUS);
    case 'disability': return pick(DISABILITY_STATUS);

    case 'aboutYourself':
      return 'I am a motivated professional with a strong track record of delivering results and a passion for continuous learning.';
    case 'whyCompany':
      return 'I am excited about this role because it aligns with my skills and offers the chance to contribute to meaningful work.';
    case 'coverLetter':
      return `Dear Hiring Manager,\n\nI am writing to express my interest in this position. My background and skills make me a strong fit for your team, and I would welcome the opportunity to contribute.\n\nThank you for your consideration.\n\nSincerely,\n${first} ${last}`;

    default: return null;
  }
}
